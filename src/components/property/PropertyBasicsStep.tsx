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
import AddressTypeahead, { AddressComponents } from "./AddressTypeahead";
import { MonthPicker } from "@/components/ui/month-picker";

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

type PropertyBasicsData = z.infer<typeof propertyBasicsSchema>;

interface PropertyBasicsStepProps {
  data: Record<string, unknown>;
  onUpdate: (data: Record<string, unknown>) => void;
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

  const handleAddressSelect = async (address: AddressComponents) => {
    setIsAutoFilling(true);
    setAddressSelected(true);

    // Update form with address components
    form.setValue("street", address.street);
    form.setValue("city", address.city);
    form.setValue("state", address.state);
    form.setValue("zipCode", address.zipCode);
    form.setValue("placeId", address.placeId);

    // TODO: In Phase 2, we'll add property data fetching here
    // For now, just show that auto-fill could happen
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    setIsAutoFilling(false);
  };

  const onSubmit = (formData: PropertyBasicsData) => {
    onUpdate(formData);
    onNext();
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
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Smart Default
                    </span>
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
                    Defaulted to Single Family Home - you can change this
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
                  <FormLabel>Purchase Price</FormLabel>
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
                    Total purchase price including closing costs
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
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Auto-Calculated
                    </span>
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
              Continue to Mortgage Information
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
}