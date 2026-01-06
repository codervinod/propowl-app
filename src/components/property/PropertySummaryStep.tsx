"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, CheckCircle, Home, DollarSign, Loader2, AlertCircle } from "lucide-react";
import type { PropertyBasicsData } from "./PropertyBasicsStep";

interface PropertyData extends Partial<PropertyBasicsData> {
  [key: string]: unknown;
}

interface PropertySummaryStepProps {
  data: PropertyData;
  onBack: () => void;
  onSave: () => Promise<void>;
}

export default function PropertySummaryStep({
  data,
  onBack,
  onSave,
}: PropertySummaryStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSave();
      // Success handled by wizard redirect
    } catch (error) {
      console.error("Property save error:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to save property. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    } catch {
      return dateString;
    }
  };

  const getPropertyTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      single_family: "Single Family Home",
      condo: "Condominium",
      townhouse: "Townhouse",
      multi_family: "Multi-Family (2-4 units)",
      apartment: "Apartment Building (5+ units)",
    };
    return types[type || ""] || type || "Not specified";
  };

  // Calculate depreciable basis for display
  const depreciableBasis = data.purchasePrice && data.landValue
    ? data.purchasePrice - data.landValue
    : 0;

  const annualDepreciation = depreciableBasis > 0
    ? Math.round(depreciableBasis / 27.5)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Setup Complete!</h2>
        <p className="text-gray-600">
          Review your property details below. You can edit any section later.
        </p>
      </div>

      {/* Property Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Property Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Home className="h-5 w-5 text-blue-500" />
              Property Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Address:</span>
              <p className="text-gray-900">
                {[data.street, data.city, data.state, data.zipCode]
                  .filter(Boolean)
                  .join(", ") || "Not specified"}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Property Type:</span>
              <p className="text-gray-900">{getPropertyTypeLabel(data.propertyType)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Purchase Date:</span>
              <p className="text-gray-900">{formatDate(data.purchaseDate)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-green-500" />
              Financial Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Purchase Price:</span>
              <p className="text-gray-900 font-semibold">{formatCurrency(data.purchasePrice)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Land Value:</span>
              <p className="text-gray-900">{formatCurrency(data.landValue)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Depreciable Basis:</span>
              <p className="text-gray-900">{formatCurrency(depreciableBasis)}</p>
            </div>
            {annualDepreciation > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-600">Annual Depreciation:</span>
                <p className="text-gray-900 text-sm">~{formatCurrency(annualDepreciation)} per year</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Next Steps Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">What&apos;s Next?</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>✓ Your property is now set up in PropOwl</p>
            <p>→ Next: Add tax data to generate your Schedule E</p>
            <p>→ Track income, expenses, and generate tax reports</p>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {submitError && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Error saving property</p>
            </div>
            <p className="text-sm text-red-600 mt-1">{submitError}</p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Property Details
        </Button>

        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving Property...
            </>
          ) : (
            <>
              Save Property & Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}