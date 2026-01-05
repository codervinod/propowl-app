"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronRight, ChevronLeft, Building2, Calculator, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Property-level mortgage information (static data only)
const mortgageSchema = z.object({
  hasMortgage: z.enum(["yes", "no"]),
  lenderName: z.string().optional(),
  originalLoanAmount: z.number().min(0, "Loan amount must be positive").optional(),
}).refine((data) => {
  // No required fields for mortgage details in property setup
  // Annual interest will be entered in the tax year wizard
  return true;
}, {
  message: "Invalid mortgage information",
  path: ["hasMortgage"],
});

export type MortgageData = z.infer<typeof mortgageSchema>;

interface MortgageStepProps {
  data: Partial<MortgageData>;
  onUpdate: (data: Partial<MortgageData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function MortgageStep({
  data,
  onUpdate,
  onNext,
  onBack,
}: MortgageStepProps) {
  const [showMortgageDetails, setShowMortgageDetails] = useState(
    data.hasMortgage === "yes"
  );

  const form = useForm<MortgageData>({
    resolver: zodResolver(mortgageSchema),
    defaultValues: {
      hasMortgage: data.hasMortgage || "no",
      lenderName: data.lenderName || "",
      originalLoanAmount: data.originalLoanAmount || undefined,
    },
  });

  const hasMortgage = form.watch("hasMortgage");

  // Update mortgage details visibility when mortgage selection changes
  const handleMortgageChange = (value: "yes" | "no") => {
    form.setValue("hasMortgage", value);
    setShowMortgageDetails(value === "yes");

    // Clear mortgage fields if no mortgage
    if (value === "no") {
      form.setValue("lenderName", "");
      form.setValue("originalLoanAmount", undefined);
    }
  };

  const onSubmit = (formData: MortgageData) => {
    onUpdate(formData);
    onNext();
  };

  return (
    <TooltipProvider>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Mortgage Detection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium text-gray-900">Mortgage Information</h3>
            </div>

            <FormField
              control={form.control}
              name="hasMortgage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Do you have a mortgage on this property?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleMortgageChange(value as "yes" | "no");
                      }}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="mortgage-yes" />
                        <Label htmlFor="mortgage-yes">Yes, I have a mortgage</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="mortgage-no" />
                        <Label htmlFor="mortgage-no">No, paid in cash</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Basic Mortgage Information (Property Setup Only) */}
          {showMortgageDetails && hasMortgage === "yes" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Mortgage Details (Optional)
                </CardTitle>
                <CardDescription>
                  Basic loan information for your property. Annual tax data (interest, escrow) will be entered separately when you add tax year data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lender Name */}
                <FormField
                  control={form.control}
                  name="lenderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lender Name (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Chase Bank, Wells Fargo"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The bank or financial institution that holds your mortgage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Original Loan Amount */}
                <FormField
                  control={form.control}
                  name="originalLoanAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Original Loan Amount (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            className="pl-8"
                            placeholder="250,000"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(Number(e.target.value) || undefined)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        The initial loan amount when you first got the mortgage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Information Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 mb-1">Annual Tax Data Comes Later</p>
                      <p className="text-blue-700">
                        Mortgage interest, escrow payments, and other annual expenses will be entered when you add tax data for 2024 or other years.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Mortgage Message */}
          {hasMortgage === "no" && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Calculator className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-900">Cash Purchase Property</h3>
                    <p className="text-sm text-green-700">
                      No mortgage interest deduction available. You can still deduct property taxes,
                      insurance, and other rental expenses.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={onBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Property Details
            </Button>

            <Button type="submit">
              Continue to Review & Save
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
}