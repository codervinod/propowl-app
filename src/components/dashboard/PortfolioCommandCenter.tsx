"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Download,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import {
  calculateCashFlowBreakdown,
  calculateEnhancedPortfolioMetrics,
  EnhancedPortfolioMetrics
} from "@/lib/schedule-e/calculations";
import { TaxCashFlowExplainer } from "./TaxCashFlowExplainer";
import ScheduleEForm from "@/components/reports/ScheduleEForm";

interface PortfolioCommandCenterProps {
  defaultTaxYear: number;
  propertyCount: number;
  totalPortfolioValue: number;
}

export function PortfolioCommandCenter({
  defaultTaxYear,
  propertyCount,
  totalPortfolioValue
}: PortfolioCommandCenterProps) {
  const [selectedTaxYear, setSelectedTaxYear] = useState(defaultTaxYear);
  const { data: portfolioData, isLoading, error } = usePortfolioData(selectedTaxYear);

  // Schedule E modal state
  const [showScheduleEModal, setShowScheduleEModal] = useState(false);

  // Generate tax year options (2020 to current year + 1)
  const currentYear = new Date().getFullYear();
  const taxYearOptions = Array.from(
    { length: currentYear + 1 - 2020 + 1 },
    (_, i) => 2020 + i
  ).reverse();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number, showSign = false) => {
    const sign = showSign && value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const handleExportPDF = () => {
    const url = `/api/reports/pdf?includeAllProperties=true&taxYear=${selectedTaxYear}`;
    window.open(url, '_blank');
  };

  const handleExportCSV = () => {
    const url = `/api/reports/csv?includeAllProperties=true&taxYear=${selectedTaxYear}&format=csv`;
    window.open(url, '_blank');
  };

  const handleViewScheduleE = () => {
    if (portfolioData) {
      setShowScheduleEModal(true);
    }
  };

  // Calculate enhanced metrics
  const getEnhancedMetrics = (): {
    breakdown: ReturnType<typeof calculateCashFlowBreakdown>;
    metrics: EnhancedPortfolioMetrics;
  } | null => {
    if (!portfolioData || !portfolioData.properties.length) return null;

    const breakdown = calculateCashFlowBreakdown(portfolioData);
    const metrics = calculateEnhancedPortfolioMetrics(portfolioData, totalPortfolioValue);

    return { breakdown, metrics };
  };

  const getScheduleEStatus = () => {
    if (!portfolioData || !portfolioData.properties.length) {
      return {
        status: 'no-data',
        icon: AlertTriangle,
        label: 'No Data',
        color: 'text-gray-500',
        bg: 'bg-gray-50'
      };
    }

    // Check if any property has missing data
    const hasMissingData = portfolioData.properties.some(prop =>
      prop.income.rentalIncome === 0 || prop.totals.totalExpenses === 0
    );

    if (hasMissingData) {
      return {
        status: 'incomplete',
        icon: AlertTriangle,
        label: 'Needs Review',
        color: 'text-orange-600',
        bg: 'bg-orange-50'
      };
    }

    return {
      status: 'ready',
      icon: CheckCircle,
      label: 'Ready to File',
      color: 'text-green-600',
      bg: 'bg-green-50'
    };
  };

  if (isLoading) {
    return (
      <Card className="border border-blue-200 bg-white">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Main metrics skeleton */}
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-24 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Secondary metrics skeleton */}
            <div className="h-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 bg-white">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-red-700">Error Loading Portfolio Data</h3>
              <p className="text-sm text-red-600">Unable to fetch portfolio metrics</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = portfolioData && portfolioData.properties && portfolioData.properties.length > 0;
  const enhancedData = getEnhancedMetrics();
  const scheduleEStatus = getScheduleEStatus();
  const ScheduleEIcon = scheduleEStatus.icon;

  if (!hasData) {
    return (
      <Card className="border border-blue-200 bg-white">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Portfolio Command Center</h3>
              <Select
                value={selectedTaxYear.toString()}
                onValueChange={(value) => setSelectedTaxYear(parseInt(value))}
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taxYearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-center py-8">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-700 mb-2">No data for {selectedTaxYear}</h4>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Add income and expenses to your properties to see portfolio performance metrics and cash flow analysis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border border-blue-200 bg-white">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header with tax year selector */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Portfolio Command Center</h3>
                <p className="text-sm text-gray-600">
                  Tax Year {selectedTaxYear} • {propertyCount} Properties • {formatCurrency(totalPortfolioValue)} Portfolio Value
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={selectedTaxYear.toString()}
                  onValueChange={(value) => setSelectedTaxYear(parseInt(value))}
                >
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taxYearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  PDF
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                >
                  <Download className="h-3 w-3 mr-1" />
                  CSV
                </Button>
              </div>
            </div>

            {/* Main Command Center Metrics */}
            {enhancedData && (
              <div className="grid grid-cols-3 gap-4">
                {/* Net Cash Flow - Primary metric */}
                <div className={cn(
                  "rounded-lg p-4 border-l-4",
                  enhancedData.breakdown.netCashFlow >= 0
                    ? "bg-green-50 border-l-green-500"
                    : "bg-red-50 border-l-red-500"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className={cn("h-5 w-5",
                      enhancedData.breakdown.netCashFlow >= 0 ? "text-green-600" : "text-red-600"
                    )} />
                    <span className="text-sm font-medium text-gray-600">Net Cash Flow</span>
                  </div>
                  <div className="space-y-1">
                    <p className={cn("text-2xl font-bold",
                      enhancedData.breakdown.netCashFlow >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(enhancedData.breakdown.netCashFlow)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(enhancedData.breakdown.netCashFlow / 12)}/month
                    </p>
                    <p className="text-xs font-medium text-gray-600">
                      {formatPercentage(enhancedData.metrics.portfolioROI)} ROI
                    </p>
                  </div>
                </div>

                {/* Tax Impact */}
                <div className="rounded-lg p-4 bg-blue-50 border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Tax Impact</span>
                  </div>
                  <div className="space-y-1">
                    <p className={cn("text-2xl font-bold",
                      enhancedData.breakdown.taxImpact >= 0 ? "text-green-600" : "text-blue-600"
                    )}>
                      {enhancedData.breakdown.taxImpact >= 0 ? "+" : "-"}
                      {formatCurrency(enhancedData.breakdown.taxImpact)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {enhancedData.breakdown.taxImpact < 0 ? "Tax Loss" : "Taxable Income"}
                    </p>
                    <p className="text-xs font-medium text-blue-600">
                      {formatCurrency(enhancedData.metrics.depreciationAmount)} Depreciation
                    </p>
                  </div>
                </div>

                {/* Schedule E Status */}
                <div className={cn("rounded-lg p-4 border-l-4", scheduleEStatus.bg,
                  scheduleEStatus.status === 'ready' ? "border-l-green-500" :
                  scheduleEStatus.status === 'incomplete' ? "border-l-orange-500" :
                  "border-l-gray-500"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <ScheduleEIcon className={cn("h-5 w-5", scheduleEStatus.color)} />
                    <span className="text-sm font-medium text-gray-600">Schedule E</span>
                  </div>
                  <div className="space-y-2">
                    <p className={cn("text-lg font-bold", scheduleEStatus.color)}>
                      {scheduleEStatus.label}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewScheduleE}
                      className="w-full"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      View Form
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Rental Income Performance Bar */}
            {enhancedData && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-700">Rental Income Performance</h4>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-gray-600">
                        {formatCurrency(portfolioData.totals.totalIncome)} Total Income
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Home className="h-4 w-4 text-purple-600" />
                      <span className="text-gray-600">
                        {formatCurrency(enhancedData.metrics.operatingExpenses)} Operating Expenses
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Expense Ratio</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={cn("h-2 rounded-full transition-all",
                            enhancedData.metrics.expenseRatio > 70 ? "bg-red-500" :
                            enhancedData.metrics.expenseRatio > 50 ? "bg-orange-500" :
                            "bg-green-500"
                          )}
                          style={{ width: `${Math.min(enhancedData.metrics.expenseRatio, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {formatPercentage(enhancedData.metrics.expenseRatio)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Cash-on-Cash Return</p>
                    <div className="flex items-center gap-2">
                      <div className={cn("flex items-center gap-1",
                        enhancedData.metrics.cashOnCashReturn >= 8 ? "text-green-600" :
                        enhancedData.metrics.cashOnCashReturn >= 4 ? "text-orange-600" :
                        "text-red-600"
                      )}>
                        {enhancedData.metrics.cashOnCashReturn >= 4 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {formatPercentage(enhancedData.metrics.cashOnCashReturn)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        ({enhancedData.metrics.cashOnCashReturn >= 8 ? "Excellent" :
                          enhancedData.metrics.cashOnCashReturn >= 4 ? "Good" : "Needs Improvement"})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow vs Tax Impact Explainer */}
      {enhancedData && (
        <TaxCashFlowExplainer
          breakdown={enhancedData.breakdown}
          className="max-w-none"
        />
      )}

      {/* Schedule E Modal */}
      {portfolioData && (
        <ScheduleEForm
          data={portfolioData}
          isOpen={showScheduleEModal}
          onClose={() => setShowScheduleEModal(false)}
          taxYear={selectedTaxYear}
        />
      )}
    </div>
  );
}