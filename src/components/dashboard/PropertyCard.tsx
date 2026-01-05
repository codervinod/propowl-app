"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Home,
  MapPin,
  Calendar,
  TrendingUp,
  DollarSign,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePropertyPerformance } from "@/hooks/usePortfolioData";
import {
  calculatePropertyPerformance,
  PropertyPerformanceMetrics
} from "@/lib/schedule-e/calculations";

interface PropertyCardProps {
  property: {
    id: string;
    street: string;
    city: string;
    state: string;
    propertyType: string;
    purchasePrice: string;
    landValue: string;
  };
}

export function PropertyCard({
  property
}: PropertyCardProps) {
  const currentYear = 2026; // Default to current year based on user preference
  const { data: performanceData, isLoading, error } = usePropertyPerformance(
    property.id,
    currentYear
  );

  // Utility functions (moved from server component)
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getPropertyTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'single_family': 'Single Family',
      'condo': 'Condo',
      'townhouse': 'Townhouse',
      'duplex': 'Duplex',
      'multi_family': 'Multi-Family',
      'apartment': 'Apartment',
      'mobile_home': 'Mobile Home',
      'commercial': 'Commercial',
      'other': 'Other'
    };
    return typeLabels[type] || type;
  };

  const getEnhancedPerformanceDisplay = () => {
    if (isLoading) {
      return {
        income: <Loader2 className="h-3 w-3 animate-spin" />,
        netCashFlow: <Loader2 className="h-3 w-3 animate-spin" />,
        isProfit: null,
        roi: <Loader2 className="h-3 w-3 animate-spin" />,
        profitability: 'break-even' as const,
        recommendedAction: undefined,
      };
    }

    if (error || !performanceData) {
      return {
        income: "No data",
        netCashFlow: "No data",
        isProfit: null,
        roi: "No data",
        profitability: 'break-even' as const,
        recommendedAction: undefined,
      };
    }

    const income = performanceData.income.rentalIncome;
    const purchasePrice = parseFloat(property.purchasePrice);

    // Calculate enhanced performance metrics
    const performanceMetrics = calculatePropertyPerformance(performanceData, purchasePrice);

    return {
      income: formatCurrency(income),
      netCashFlow: formatCurrency(Math.abs(performanceMetrics.monthlyNetCashFlow)),
      isProfit: performanceMetrics.isProfit,
      roi: `${performanceMetrics.annualROI.toFixed(1)}%`,
      profitability: performanceMetrics.profitability,
      recommendedAction: performanceMetrics.recommendedAction,
    };
  };

  const performance = getEnhancedPerformanceDisplay();

  // Get performance indicator styling
  const getProfitabilityDisplay = (profitability: PropertyPerformanceMetrics['profitability']) => {
    switch (profitability) {
      case 'excellent':
        return {
          label: '🚀 Excellent',
          colorClass: 'text-green-700 bg-green-100',
          description: 'High-performing property'
        };
      case 'good':
        return {
          label: '✅ Good',
          colorClass: 'text-green-600 bg-green-50',
          description: 'Solid investment performance'
        };
      case 'break-even':
        return {
          label: '⚠️ Break-even',
          colorClass: 'text-orange-600 bg-orange-50',
          description: 'Consider optimization'
        };
      case 'loss':
        return {
          label: '❌ Loss',
          colorClass: 'text-red-600 bg-red-50',
          description: 'Needs immediate attention'
        };
      default:
        return {
          label: 'Unknown',
          colorClass: 'text-gray-600 bg-gray-50',
          description: 'Performance analysis pending'
        };
    }
  };

  const profitabilityDisplay = getProfitabilityDisplay(performance.profitability);

  return (
    <Link href={`/properties/${property.id}`}>
      <Card className="border hover:border-orange-300 transition-all shadow-md hover:shadow-lg bg-white cursor-pointer group">
        <CardHeader>
          <CardTitle className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-orange-500" />
              <span className="text-lg font-semibold text-gray-800 group-hover:text-orange-600">
                {getPropertyTypeLabel(property.propertyType)}
              </span>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Active
            </span>
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            {property.street}, {property.city}, {property.state}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Original purchase data */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Purchase Price</span>
              <p className="font-semibold">{formatCurrency(property.purchasePrice)}</p>
            </div>
            <div>
              <span className="text-gray-500">Land Value</span>
              <p className="font-semibold">{formatCurrency(property.landValue)}</p>
            </div>
          </div>

          {/* Enhanced Investment Performance Section */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">
                {currentYear} Performance:
              </span>
              <div className={cn("text-xs px-2 py-1 rounded-full font-medium", profitabilityDisplay.colorClass)}>
                {profitabilityDisplay.label}
              </div>
            </div>

            <div className="space-y-3">
              {/* ROI and Cash Flow Row */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="h-3 w-3 text-purple-500" />
                    <span className="text-gray-500 text-xs">Annual ROI</span>
                  </div>
                  <p className={cn("font-bold",
                    performance.profitability === 'excellent' ? "text-green-600" :
                    performance.profitability === 'good' ? "text-green-600" :
                    performance.profitability === 'break-even' ? "text-orange-600" :
                    "text-red-600"
                  )}>
                    {performance.roi}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className={cn("h-3 w-3",
                      performance.isProfit ? "text-green-500" : "text-red-500"
                    )} />
                    <span className="text-gray-500 text-xs">Cash Flow/mo</span>
                  </div>
                  <p className={cn("font-semibold",
                    performance.isProfit ? "text-green-600" : "text-red-600"
                  )}>
                    {performance.isProfit ? "+" : "-"}{performance.netCashFlow}
                  </p>
                </div>
              </div>

              {/* Rental Income Row */}
              <div className="bg-blue-50 rounded p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-gray-600">Rental Income</span>
                  </div>
                  <span className="font-semibold text-blue-600 text-sm">
                    {performance.income}
                  </span>
                </div>
              </div>

              {/* Recommendation if available */}
              {performance.recommendedAction && (
                <div className="bg-amber-50 border border-amber-200 rounded p-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs">💡</span>
                    <p className="text-xs text-amber-700 font-medium">
                      {performance.recommendedAction}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Manage Tax Data footer */}
          <div className="border-t pt-4">
            <div className="text-center text-sm text-gray-600 group-hover:text-orange-600 transition-colors">
              <Calendar className="h-4 w-4 mx-auto mb-1" />
              Manage Tax Data
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}