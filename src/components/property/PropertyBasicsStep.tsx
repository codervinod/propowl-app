"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ChevronRight, Calculator, Info, MapPin } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AddressTypeahead, { AddressComponents, PropertyDataResult } from "./AddressTypeahead";
import { MonthPicker } from "@/components/ui/month-picker";
import { AutoFilledBadge, LoadingFieldIndicator, ErrorMessage } from "@/components/ui/field-status";
import { DuplicateWarningDialog } from "./DuplicateWarningDialog";

// Simplified validation - only essential fields required, smart defaults for others
const propertyBasicsSchema = z.object({
  // Address (auto-populated from typeahead)
  street: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2).max(2),
  zipCode: z.string().min(5),
  placeId: z.string().optional(),

  // Smart defaults with user override (handled in defaultValues)
  propertyType: z.enum([
    "single_family",
    "condo",
    "townhouse",
    "multi_family",
    "apartment",
  ]),
  purchasePrice: z.number().min(1, "Purchase price is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  landValue: z.number().min(0, "Land value must be positive"),
});

export type PropertyBasicsData = z.infer<typeof propertyBasicsSchema>;

interface PropertyBasicsStepProps {
  data: Partial<PropertyBasicsData>;
  onUpdate: (data: Partial<PropertyBasicsData>) => void;
  onNext: () => void;
}

const PROPERTY_TYPE_OPTIONS = [
  { value: "single_family", label: "Single Family Home" },
  { value: "condo", label: "Condominium" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi_family", label: "Multi-Family (2-4 units)" },
  { value: "apartment", label: "Apartment Building (5+ units)" },
];

export default function PropertyBasicsStep({
  data,
  onUpdate,
  onNext,
}: PropertyBasicsStepProps) {
  const [landValuePercentage, setLandValuePercentage] = useState([20]);
  const [addressSelected, setAddressSelected] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [propertyDataSource, setPropertyDataSource] = useState<string | null>(null);
  const [propertyDataError, setPropertyDataError] = useState<string | null>(null);

  // Duplicate checking state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateCheckData, setDuplicateCheckData] = useState<{
    hasDuplicate: boolean;
    duplicateProperty?: {
      id: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    potentialShares: {
      ownerEmail: string;
      ownerName: string;
      propertyId: string;
      address: string;
      suggestion: string;
    }[];
  }>({ hasDuplicate: false, potentialShares: [] });
  const [pendingFormData, setPendingFormData] = useState<PropertyBasicsData | null>(null);

  const form = useForm<PropertyBasicsData>({
    resolver: zodResolver(propertyBasicsSchema),
    defaultValues: {
      street: data.street || "",
      city: data.city || "",
      state: data.state || "",
      zipCode: data.zipCode || "",
      placeId: data.placeId || "",
      propertyType: data.propertyType || "single_family",
      purchaseDate: data.purchaseDate || "", // Empty string to avoid hydration issues
      purchasePrice: data.purchasePrice || 0,
      landValue: data.landValue || 0,
    },
  });

  // Set current month after hydration to avoid SSR mismatch
  useEffect(() => {
    if (!data.purchaseDate || data.purchaseDate === "") {
      const currentMonth = new Date().toISOString().slice(0, 7);
      form.setValue("purchaseDate", currentMonth);
    }
  }, [form, data.purchaseDate]);

  const purchasePrice = form.watch("purchasePrice");

  // Auto-calculate land value based on percentage
  const handleLandPercentageChange = (value: number[]) => {
    setLandValuePercentage(value);
    if (purchasePrice > 0) {
      const calculatedLandValue = Math.round(purchasePrice * (value[0] / 100));
      form.setValue("landValue", calculatedLandValue);
    }
  };

  // Update percentage when purchase price changes
  const handlePurchasePriceChange = (value: number) => {
    form.setValue("purchasePrice", value);
    if (value > 0) {
      const calculatedLandValue = Math.round(value * (landValuePercentage[0] / 100));
      form.setValue("landValue", calculatedLandValue);
    }
  };


  const handleAddressSelect = async (address: AddressComponents, propertyData?: PropertyDataResult) => {
    // First call is just address selection
    if (!propertyData) {
      setAddressSelected(true);
      setIsAutoFilling(true);
      setPropertyDataError(null); // Clear any previous errors

      // Update form with address components
      form.setValue("street", address.street);
      form.setValue("city", address.city);
      form.setValue("state", address.state);
      form.setValue("zipCode", address.zipCode);
      form.setValue("placeId", address.placeId);

      return;
    }

    // Second call includes property data
    try {
      const newAutoFilledFields = new Set<string>();

      // Auto-fill property type if available
      if (propertyData.propertyType) {
        form.setValue("propertyType", propertyData.propertyType as "single_family" | "condo" | "townhouse" | "multi_family" | "apartment");
        newAutoFilledFields.add("propertyType");
      }

      // Auto-fill purchase price if estimated value is available
      if (propertyData.estimatedValue && propertyData.estimatedValue > 0) {
        form.setValue("purchasePrice", propertyData.estimatedValue);
        newAutoFilledFields.add("purchasePrice");
      }

      // Auto-fill land value if available
      if (propertyData.landValue && propertyData.landValue > 0) {
        form.setValue("landValue", propertyData.landValue);
        newAutoFilledFields.add("landValue");

        // Update land percentage to match the calculated value
        if (propertyData.landValuePercentage) {
          setLandValuePercentage([propertyData.landValuePercentage]);
        }
      }

      // Update auto-filled fields tracking
      setAutoFilledFields(newAutoFilledFields);
      setPropertyDataSource(propertyData.source);

      // Check if there was an error in the property data
      if (propertyData.error) {
        setPropertyDataError(`Property data unavailable: ${propertyData.error}`);
      }

    } catch (error) {
      console.error("Error processing property data:", error);
      setPropertyDataError("Failed to process property data. You can continue with manual entry.");
    } finally {
      setIsAutoFilling(false);
    }
  };

  const checkForDuplicates = async (formData: PropertyBasicsData) => {
    try {
      const response = await fetch("/api/properties/check-duplicate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        console.error("Duplicate check failed:", response.status);
        return { hasDuplicate: false, potentialShares: [] };
      }
    } catch (error) {
      console.error("Duplicate check error:", error);
      return { hasDuplicate: false, potentialShares: [] };
    }
  };

  const onSubmit = async (formData: PropertyBasicsData) => {
    // Check for duplicates
    const duplicateResult = await checkForDuplicates(formData);

    if (duplicateResult.hasDuplicate || duplicateResult.potentialShares.length > 0) {
      // Show duplicate warning dialog
      setDuplicateCheckData(duplicateResult);
      setPendingFormData(formData);
      setShowDuplicateDialog(true);
    } else {
      // No duplicates, proceed normally
      onUpdate(formData);
      onNext();
    }
  };

  const handleProceedAnyway = () => {
    if (pendingFormData) {
      setShowDuplicateDialog(false);
      onUpdate(pendingFormData);
      onNext();
      setPendingFormData(null);
    }
  };

  const handleDuplicateDialogClose = () => {
    setShowDuplicateDialog(false);
    setPendingFormData(null);
    setDuplicateCheckData({ hasDuplicate: false, potentialShares: [] });
  };

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Property Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium text-gray-900">Property Address</h3>
              {isAutoFilling && (
                <span className="text-sm text-blue-600 animate-pulse">Auto-filling...</span>
              )}
            </div>

            {/* Address Typeahead */}
            <div className="space-y-4">
              <AddressTypeahead
                onAddressSelect={handleAddressSelect}
                defaultValue={
                  form.getValues("street") || form.getValues("city")
                    ? `${form.getValues("street")} ${form.getValues("city")} ${form.getValues("state")} ${form.getValues("zipCode")}`.trim()
                    : ""
                }
                placeholder="Start typing a property address..."
              />

              {/* Address Fields (auto-populated, read-only for display) */}
              {addressSelected && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
                  <div>
                    <Label className="text-sm text-gray-600">Street</Label>
                    <p className="font-medium">{form.watch("street")}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">City</Label>
                    <p className="font-medium">{form.watch("city")}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">State</Label>
                    <p className="font-medium">{form.watch("state")}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">ZIP Code</Label>
                    <p className="font-medium">{form.watch("zipCode")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Property Data Error */}
          {propertyDataError && (
            <ErrorMessage message={propertyDataError} />
          )}


          {/* Property Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Property Details</h3>

            <FormField
              control={form.control}
              name="propertyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Property Type
                    {isAutoFilling && autoFilledFields.has("propertyType") ? (
                      <LoadingFieldIndicator />
                    ) : autoFilledFields.has("propertyType") ? (
                      <AutoFilledBadge source={propertyDataSource || undefined} />
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Smart Default
                      </span>
                    )}
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROPERTY_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {autoFilledFields.has("propertyType")
                      ? `Auto-filled based on ${propertyDataSource === "google_places" ? "Google Places data" : "smart analysis"} - you can change this`
                      : "Defaulted to Single Family Home - you can change this"
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Purchase Date
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Smart Default
                    </span>
                  </FormLabel>
                  <FormControl>
                    <MonthPicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select purchase month"
                      maxDate={new Date()}
                    />
                  </FormControl>
                  <FormDescription>
                    Defaulted to current month - adjust if needed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Purchase Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Purchase Information</h3>

            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Purchase Price
                    {isAutoFilling && autoFilledFields.has("purchasePrice") && (
                      <LoadingFieldIndicator />
                    )}
                    {autoFilledFields.has("purchasePrice") && !isAutoFilling && (
                      <AutoFilledBadge source={propertyDataSource || undefined} />
                    )}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        className="pl-8"
                        placeholder="300,000"
                        value={field.value || ""}
                        onChange={(e) => handlePurchasePriceChange(Number(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {autoFilledFields.has("purchasePrice")
                      ? `Estimated value from ${propertyDataSource === "google_places" ? "property data" : "market analysis"} - please adjust if needed`
                      : "Total purchase price including closing costs"
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="landValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Land Value
                    {isAutoFilling && autoFilledFields.has("landValue") ? (
                      <LoadingFieldIndicator />
                    ) : autoFilledFields.has("landValue") ? (
                      <AutoFilledBadge source={propertyDataSource || undefined} />
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Auto-Calculated
                      </span>
                    )}
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Land value is used to calculate depreciation.</p>
                        <p>Only the building can be depreciated, not the land.</p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>

                  {purchasePrice > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <Label className="text-sm text-gray-600">
                          Land is typically 15-25% of purchase price
                        </Label>
                        <Calculator className="h-4 w-4 text-gray-400" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>15%</span>
                          <span>{landValuePercentage[0]}%</span>
                          <span>25%</span>
                        </div>
                        <Slider
                          value={landValuePercentage}
                          onValueChange={handleLandPercentageChange}
                          min={15}
                          max={25}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        className="pl-8"
                        placeholder="60,000"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </div>
                  </FormControl>

                  {purchasePrice > 0 && field.value > 0 && (
                    <FormDescription>
                      Depreciable basis: ${(purchasePrice - field.value).toLocaleString()}
                      (Annual depreciation: ${Math.round((purchasePrice - field.value) / 27.5).toLocaleString()})
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Next Button */}
          <div className="flex justify-end pt-6">
            <Button type="submit" className="flex items-center gap-2">
              Continue to Review & Save
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>

      {/* Duplicate Warning Dialog */}
      <DuplicateWarningDialog
        isOpen={showDuplicateDialog}
        onClose={handleDuplicateDialogClose}
        onProceedAnyway={handleProceedAnyway}
        hasDuplicate={duplicateCheckData.hasDuplicate}
        duplicateProperty={duplicateCheckData.duplicateProperty}
        potentialShares={duplicateCheckData.potentialShares}
        address={pendingFormData ? `${pendingFormData.street}, ${pendingFormData.city}, ${pendingFormData.state}` : ""}
      />
    </TooltipProvider>
  );
}