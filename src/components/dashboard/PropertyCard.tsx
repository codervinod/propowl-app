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
  TrendingDown,
  DollarSign,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePropertyPerformance } from "@/hooks/usePortfolioData";

interface PropertyCardProps {
  property: {
    id: string;
    street: string;
    streetLine2?: string | null;
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

  const getPerformanceDisplay = () => {
    if (isLoading) {
      return {
        income: <Loader2 className="h-3 w-3 animate-spin" />,
        netIncome: <Loader2 className="h-3 w-3 animate-spin" />,
        isProfit: null,
      };
    }

    if (error || !performanceData) {
      return {
        income: "No data",
        netIncome: "No data",
        isProfit: null,
      };
    }

    const income = performanceData.income.rentalIncome;
    const netIncome = performanceData.totals.netIncome;
    const isProfit = netIncome >= 0;

    return {
      income: formatCurrency(income),
      netIncome: formatCurrency(Math.abs(netIncome)),
      isProfit,
    };
  };

  const performance = getPerformanceDisplay();

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
            {property.street}{property.streetLine2 ? `, ${property.streetLine2}` : ''}, {property.city}, {property.state}
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

          {/* Enhanced YTD Performance Section */}
          <div className="border-t pt-3">
            <div className="text-xs font-medium text-gray-700 mb-2">
              {currentYear} YTD Performance:
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <DollarSign className="h-3 w-3 text-blue-500" />
                  <span className="text-gray-500 text-xs">Rental Income</span>
                </div>
                <p className="font-semibold text-blue-600">
                  {performance.income}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {performance.isProfit === true && (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  )}
                  {performance.isProfit === false && (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  {performance.isProfit === null && (
                    <div className="h-3 w-3" />
                  )}
                  <span className="text-gray-500 text-xs">Net Income</span>
                </div>
                <div className="flex items-center gap-1">
                  <p className={cn(
                    "font-semibold",
                    performance.isProfit === true && "text-green-600",
                    performance.isProfit === false && "text-red-600",
                    performance.isProfit === null && "text-gray-400"
                  )}>
                    {performance.isProfit === false ? "-" : ""}{performance.netIncome}
                  </p>
                  {performance.isProfit === true && (
                    <span className="text-green-600 text-xs">✓ Profitable</span>
                  )}
                  {performance.isProfit === false && (
                    <span className="text-red-600 text-xs">⚠ Loss</span>
                  )}
                </div>
              </div>
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