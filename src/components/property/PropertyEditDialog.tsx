"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Calculator, Info, MapPin, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AddressTypeahead, { AddressComponents } from "./AddressTypeahead";
import { MonthPicker } from "@/components/ui/month-picker";
import { toast } from "sonner";

// Property edit validation schema
const propertyEditSchema = z.object({
  // Address
  street: z.string().min(1, "Street is required"),
  streetLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "State must be 2 characters"),
  zipCode: z.string().min(5, "ZIP code is required"),
  placeId: z.string().optional(),

  // Property details
  propertyType: z.enum([
    "single_family",
    "condo",
    "townhouse",
    "multi_family",
    "apartment",
  ]),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  purchasePrice: z.number().min(1, "Purchase price must be positive"),
  landValue: z.number().min(0, "Land value must be non-negative"),
  customDepreciation: z.number().min(0, "Custom depreciation must be positive").optional(),
});

export type PropertyEditData = z.infer<typeof propertyEditSchema>;

interface Property {
  id: string;
  street: string;
  streetLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  purchaseDate: string;
  purchasePrice: string;
  landValue: string;
  customDepreciation?: string | null;
}

interface PropertyEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onSuccess: () => void;
}

const PROPERTY_TYPE_OPTIONS = [
  { value: "single_family", label: "Single Family Home" },
  { value: "condo", label: "Condominium" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi_family", label: "Multi-Family (2-4 units)" },
  { value: "apartment", label: "Apartment Building (5+ units)" },
];

export default function PropertyEditDialog({
  isOpen,
  onClose,
  property,
  onSuccess,
}: PropertyEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [landValuePercentage, setLandValuePercentage] = useState([20]);
  const [addressSelected, setAddressSelected] = useState(true); // Start with address already selected

  const form = useForm<PropertyEditData>({
    resolver: zodResolver(propertyEditSchema),
    defaultValues: {
      street: property.street,
      streetLine2: property.streetLine2 || "",
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      placeId: "",
      propertyType: property.propertyType as "single_family" | "condo" | "townhouse" | "multi_family" | "apartment",
      purchaseDate: property.purchaseDate.slice(0, 7), // Convert YYYY-MM-DD to YYYY-MM
      purchasePrice: parseFloat(property.purchasePrice),
      landValue: parseFloat(property.landValue),
      customDepreciation: property.customDepreciation ? parseFloat(property.customDepreciation) : undefined,
    },
  });

  // Calculate initial land value percentage
  useEffect(() => {
    const purchasePrice = parseFloat(property.purchasePrice);
    const landValue = parseFloat(property.landValue);
    if (purchasePrice > 0 && landValue > 0) {
      const percentage = Math.round((landValue / purchasePrice) * 100);
      setLandValuePercentage([percentage]);
    }
  }, [property]);

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
    // Update form with address components
    form.setValue("street", address.street);
    form.setValue("city", address.city);
    form.setValue("state", address.state);
    form.setValue("zipCode", address.zipCode);
    form.setValue("placeId", address.placeId);
    setAddressSelected(true);
  };

  const onSubmit = async (formData: PropertyEditData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          street: formData.street,
          streetLine2: formData.streetLine2,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          propertyType: formData.propertyType,
          purchaseDate: formData.purchaseDate,
          purchasePrice: formData.purchasePrice,
          landValue: formData.landValue,
          customDepreciation: formData.customDepreciation,
        }),
      });

      if (response.ok) {
        await response.json();
        toast.success("Property updated successfully");
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update property");
      }
    } catch (error) {
      console.error("Error updating property:", error);
      toast.error("Failed to update property");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
          <DialogDescription>
            Update the property information below.
          </DialogDescription>
        </DialogHeader>

        <TooltipProvider>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Property Address */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium text-gray-900">Property Address</h3>
                </div>

                {/* Address Typeahead */}
                <div className="space-y-4">
                  <AddressTypeahead
                    onAddressSelect={handleAddressSelect}
                    defaultValue={`${property.street} ${property.city} ${property.state} ${property.zipCode}`}
                    placeholder="Start typing a property address..."
                  />

                  {/* Address Fields (auto-populated, read-only for display) */}
                  {addressSelected && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                      {/* Unit/Suite Field - editable */}
                      <FormField
                        control={form.control}
                        name="streetLine2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit/Suite/Apartment (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Unit 2A, Suite 101, Apt 4B"
                                {...field}
                                className="max-w-md"
                              />
                            </FormControl>
                            <FormDescription>
                              Add unit, suite, or apartment number if applicable
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                      <FormLabel>Property Type</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date</FormLabel>
                      <FormControl>
                        <MonthPicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select purchase month"
                          maxDate={new Date()}
                        />
                      </FormControl>
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
                          (Calculated annual depreciation: ${Math.round((purchasePrice - field.value) / 27.5).toLocaleString()})
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customDepreciation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Custom Annual Depreciation (Optional)
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Override
                        </span>
                      </FormLabel>
                      <FormDescription className="text-sm text-gray-600">
                        Enter your CPA&apos;s depreciation amount to override the calculated value. Leave blank to use calculated depreciation.
                      </FormDescription>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            className="pl-8"
                            placeholder="5,855"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </div>
                      </FormControl>
                      {field.value && field.value > 0 && (
                        <FormDescription className="text-blue-600">
                          ✓ Using custom depreciation: ${field.value.toLocaleString()} annually
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </TooltipProvider>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}