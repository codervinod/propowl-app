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
// Removed dropdown menu import - using simple buttons instead
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import ScheduleEForm from "@/components/reports/ScheduleEForm";

interface PortfolioSummaryCardProps {
  defaultTaxYear: number;
  propertyCount: number;
}

// PortfolioMetrics interface removed - using data directly from API

export function PortfolioSummaryCard({
  defaultTaxYear,
  propertyCount // eslint-disable-line @typescript-eslint/no-unused-vars
}: PortfolioSummaryCardProps) {
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

  const getNetIncomeDisplay = (netIncome: number) => {
    const isProfit = netIncome >= 0;
    return {
      amount: formatCurrency(Math.abs(netIncome)),
      isProfit,
      icon: isProfit ? TrendingUp : TrendingDown,
      colorClass: isProfit ? "text-green-600" : "text-red-600",
      bgClass: isProfit ? "bg-green-50" : "bg-red-50",
      label: isProfit ? "Net Income" : "Net Loss"
    };
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
    // Open the Schedule E modal using the already-loaded portfolio data
    if (portfolioData) {
      setShowScheduleEModal(true);
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-blue-200 bg-white">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header with tax year selector */}
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Hero metrics skeleton */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>

            {/* Actions skeleton */}
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-200 bg-white">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-red-600">Error loading portfolio data</p>
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

  if (!hasData) {
    return (
      <Card className="border border-blue-200 bg-white">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Portfolio Performance</h3>
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

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500">No data for {selectedTaxYear}</p>
              <p className="text-xs text-gray-400">
                Add income and expenses to see portfolio metrics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = {
    netIncome: portfolioData.totals.netIncome,
    rentalIncome: portfolioData.totals.totalIncome,
    totalExpenses: portfolioData.totals.totalExpenses,
    propertyCount: portfolioData.properties.length
  };

  const netIncomeDisplay = getNetIncomeDisplay(metrics.netIncome);
  const NetIncomeIcon = netIncomeDisplay.icon;

  return (
    <Card className="border border-blue-200 bg-white">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with tax year selector */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Portfolio Performance</h3>
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

          {/* Hero metrics */}
          <div className="grid grid-cols-2 gap-4">
            {/* Net Income - Primary metric (larger) */}
            <div className={cn("rounded-lg p-3", netIncomeDisplay.bgClass)}>
              <div className="flex items-center gap-2 mb-1">
                <NetIncomeIcon className={cn("h-4 w-4", netIncomeDisplay.colorClass)} />
                <span className="text-xs font-medium text-gray-600">
                  {netIncomeDisplay.label}
                </span>
              </div>
              <p className={cn("text-xl font-bold", netIncomeDisplay.colorClass)}>
                {netIncomeDisplay.amount}
              </p>
            </div>

            {/* Rental Income - Secondary metric */}
            <div className="rounded-lg p-3 bg-blue-50">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-600">Rental Income</span>
              </div>
              <p className="text-lg font-semibold text-blue-600">
                {formatCurrency(metrics.rentalIncome)}
              </p>
            </div>
          </div>

          {/* Supporting metrics */}
          <div className="flex justify-between text-xs text-gray-600">
            <span>Expenses: {formatCurrency(metrics.totalExpenses)}</span>
            <span>Properties: {metrics.propertyCount}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewScheduleE}
              className="flex-1"
            >
              <FileText className="h-3 w-3 mr-1" />
              View Schedule E
            </Button>

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
      </CardContent>

      {/* Schedule E Modal */}
      {portfolioData && (
        <ScheduleEForm
          data={portfolioData}
          isOpen={showScheduleEModal}
          onClose={() => setShowScheduleEModal(false)}
          taxYear={selectedTaxYear}
        />
      )}
    </Card>
  );
}