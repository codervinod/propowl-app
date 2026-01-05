"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Info,
  ChevronDown,
  ChevronUp,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CashFlowBreakdown {
  netCashFlow: number;
  depreciationBenefit: number;
  taxImpact: number;
  operatingProfit: number;
}

interface TaxCashFlowExplainerProps {
  breakdown: CashFlowBreakdown;
  className?: string;
}

export function TaxCashFlowExplainer({
  breakdown,
  className
}: TaxCashFlowExplainerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const isNetCashPositive = breakdown.netCashFlow > 0;
  const isTaxLoss = breakdown.taxImpact < 0;

  // Determine the primary message
  const getPrimaryMessage = () => {
    if (isNetCashPositive && isTaxLoss) {
      return {
        title: "Positive Cash Flow + Tax Benefits",
        description: "Your properties generate cash while providing tax deductions",
        icon: TrendingUp,
        colorClass: "text-green-600",
        bgClass: "bg-green-50",
      };
    } else if (isNetCashPositive && !isTaxLoss) {
      return {
        title: "Profitable Portfolio",
        description: "Strong performance with both cash flow and taxable income",
        icon: TrendingUp,
        colorClass: "text-green-600",
        bgClass: "bg-green-50",
      };
    } else if (!isNetCashPositive && isTaxLoss) {
      return {
        title: "Cash Loss + Tax Loss",
        description: "Portfolio needs attention - both cash flow and tax impact are negative",
        icon: TrendingDown,
        colorClass: "text-red-600",
        bgClass: "bg-red-50",
      };
    } else {
      return {
        title: "Cash Loss with Tax Liability",
        description: "Unusual situation - negative cash flow but positive taxable income",
        icon: TrendingDown,
        colorClass: "text-orange-600",
        bgClass: "bg-orange-50",
      };
    }
  };

  const primaryMessage = getPrimaryMessage();
  const PrimaryIcon = primaryMessage.icon;

  return (
    <Card className={cn("border-l-4",
      isNetCashPositive ? "border-l-green-500" : "border-l-red-500",
      className
    )}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with primary message */}
          <div className={cn("flex items-center justify-between p-3 rounded-lg", primaryMessage.bgClass)}>
            <div className="flex items-center gap-3">
              <PrimaryIcon className={cn("h-5 w-5", primaryMessage.colorClass)} />
              <div>
                <h4 className={cn("font-semibold", primaryMessage.colorClass)}>
                  {primaryMessage.title}
                </h4>
                <p className="text-sm text-gray-600">{primaryMessage.description}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-auto"
            >
              <Info className="h-4 w-4 text-gray-500" />
              {isExpanded ? (
                <ChevronUp className="h-3 w-3 ml-1 text-gray-500" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-1 text-gray-500" />
              )}
            </Button>
          </div>

          {/* Quick summary metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className={cn("h-4 w-4",
                isNetCashPositive ? "text-green-500" : "text-red-500"
              )} />
              <div>
                <p className="text-xs text-gray-500">Actual Cash Flow</p>
                <p className={cn("font-semibold",
                  isNetCashPositive ? "text-green-600" : "text-red-600"
                )}>
                  {isNetCashPositive ? "+" : "-"}{formatCurrency(breakdown.netCashFlow)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className={cn("h-4 w-4",
                isTaxLoss ? "text-blue-500" : "text-gray-500"
              )} />
              <div>
                <p className="text-xs text-gray-500">Tax Impact</p>
                <p className={cn("font-semibold",
                  isTaxLoss ? "text-blue-600" : "text-gray-600"
                )}>
                  {breakdown.taxImpact < 0 ? "-" : "+"}{formatCurrency(breakdown.taxImpact)}
                  {isTaxLoss && <span className="text-xs ml-1">(Loss)</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed breakdown when expanded */}
          {isExpanded && (
            <div className="border-t pt-3 space-y-3">
              <h5 className="font-medium text-gray-700">Cash Flow vs Tax Breakdown:</h5>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-gray-600">Operating Profit</span>
                  <span className={cn("font-medium",
                    breakdown.operatingProfit >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {breakdown.operatingProfit >= 0 ? "+" : "-"}{formatCurrency(breakdown.operatingProfit)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Depreciation (non-cash)</span>
                  <span className="font-medium text-blue-600">
                    -{formatCurrency(breakdown.depreciationBenefit)}
                  </span>
                </div>

                <div className="border-t pt-2 flex justify-between items-center font-medium">
                  <span>Tax Impact (Schedule E)</span>
                  <span className={cn(
                    breakdown.taxImpact >= 0 ? "text-green-600" : "text-blue-600"
                  )}>
                    {breakdown.taxImpact >= 0 ? "+" : "-"}{formatCurrency(breakdown.taxImpact)}
                  </span>
                </div>
              </div>

              {/* Key insight */}
              <div className="bg-amber-50 p-3 rounded border-l-4 border-l-amber-400">
                <p className="text-sm text-amber-800">
                  <strong>Key Insight:</strong> {
                    isNetCashPositive && isTaxLoss
                      ? "Your properties generate positive cash while depreciation creates tax deductions."
                      : isNetCashPositive
                        ? "Strong portfolio performance with positive cash flow and potential tax liability."
                        : "Portfolio may need optimization to improve cash flow."
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}