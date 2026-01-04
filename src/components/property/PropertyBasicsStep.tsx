"use client";

import { useState } from "react";
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
import { ChevronRight, Calculator, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const propertyBasicsSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required").max(2, "Use 2-letter state code"),
  zipCode: z.string().min(5, "ZIP code must be at least 5 digits"),
  propertyType: z.enum([
    "single_family",
    "condo",
    "townhouse",
    "multi_family",
    "apartment",
  ]).refine((val) => !!val, {
    message: "Please select a property type",
  }),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  purchasePrice: z.number().min(1, "Purchase price must be greater than 0"),
  landValue: z.number().min(1, "Land value must be greater than 0"),
});

type PropertyBasicsData = z.infer<typeof propertyBasicsSchema>;

interface PropertyBasicsStepProps {
  data: any;
  onUpdate: (data: any) => void;
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

  const form = useForm<PropertyBasicsData>({
    resolver: zodResolver(propertyBasicsSchema),
    defaultValues: {
      street: data.street || "",
      city: data.city || "",
      state: data.state || "",
      zipCode: data.zipCode || "",
      propertyType: data.propertyType || undefined,
      purchaseDate: data.purchaseDate || "",
      purchasePrice: data.purchasePrice || 0,
      landValue: data.landValue || 0,
    },
  });

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
            <h3 className="text-lg font-medium text-gray-900">Property Address</h3>

            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Austin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="TX" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="78701" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <Input
                      type="month"
                      {...field}
                      max={new Date().toISOString().slice(0, 7)}
                    />
                  </FormControl>
                  <FormDescription>
                    Month and year when you purchased the property
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