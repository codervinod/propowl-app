/**
 * Schedule E calculation business logic
 * Handles aggregation of property data into IRS Schedule E format
 */

import {
  ScheduleEData,
  ScheduleEExpenses,
  ScheduleEIncome,
  ScheduleESummary,
  ScheduleEProperty,
} from "./types";
import {
  calculateDepreciationForTaxYear,
  calculateDepreciableBasis,
} from "../depreciation";

/**
 * Calculate Schedule E expenses from raw expense data
 * Maps expense categories from database to Schedule E line items
 */
export function calculateScheduleEExpenses(
  expenses: Array<{
    category: string;
    amount: number;
  }>
): ScheduleEExpenses {
  const scheduleExpenses: ScheduleEExpenses = {
    advertising: 0,
    autoAndTravel: 0,
    cleaningAndMaintenance: 0,
    commissions: 0,
    insurance: 0,
    legal: 0,
    managementFees: 0,
    mortgageInterest: 0,
    otherInterest: 0,
    repairs: 0,
    supplies: 0,
    taxes: 0,
    utilities: 0,
    depreciation: 0, // Calculated separately
    other: 0,
  };

  // Map database expense categories to Schedule E lines
  expenses.forEach((expense) => {
    switch (expense.category) {
      case "advertising":
        scheduleExpenses.advertising += expense.amount;
        break;
      case "auto_travel":
        scheduleExpenses.autoAndTravel += expense.amount;
        break;
      case "cleaning_maintenance":
        scheduleExpenses.cleaningAndMaintenance += expense.amount;
        break;
      case "commissions":
        scheduleExpenses.commissions += expense.amount;
        break;
      case "insurance":
        scheduleExpenses.insurance += expense.amount;
        break;
      case "legal_professional":
        scheduleExpenses.legal += expense.amount;
        break;
      case "management_fees":
        scheduleExpenses.managementFees += expense.amount;
        break;
      case "mortgage_interest":
        scheduleExpenses.mortgageInterest += expense.amount;
        break;
      case "other_interest":
        scheduleExpenses.otherInterest += expense.amount;
        break;
      case "repairs":
        scheduleExpenses.repairs += expense.amount;
        break;
      case "supplies":
        scheduleExpenses.supplies += expense.amount;
        break;
      case "property_taxes":
        scheduleExpenses.taxes += expense.amount;
        break;
      case "utilities":
        scheduleExpenses.utilities += expense.amount;
        break;
      case "other":
      default:
        scheduleExpenses.other += expense.amount;
        break;
    }
  });

  return scheduleExpenses;
}

/**
 * Calculate Schedule E income from raw income data
 * Annualizes income based on frequency
 */
export function calculateScheduleEIncome(
  incomeEntries: Array<{
    amount: number;
    frequency: "monthly" | "quarterly" | "annual" | "one_time";
    description?: string;
  }>
): ScheduleEIncome {
  let totalRentalIncome = 0;

  incomeEntries.forEach((entry) => {
    let annualizedAmount = entry.amount;

    // Annualize based on frequency
    switch (entry.frequency) {
      case "monthly":
        annualizedAmount = entry.amount * 12;
        break;
      case "quarterly":
        annualizedAmount = entry.amount * 4;
        break;
      case "annual":
        annualizedAmount = entry.amount;
        break;
      case "one_time":
        annualizedAmount = entry.amount;
        break;
    }

    totalRentalIncome += annualizedAmount;
  });

  return {
    rentalIncome: Math.round(totalRentalIncome * 100) / 100,
  };
}

/**
 * Calculate depreciation for Schedule E Line 18
 */
export function calculateDepreciation(
  property: ScheduleEProperty,
  taxYear: number
): number {
  return calculateDepreciationForTaxYear(
    property.purchasePrice,
    property.landValue,
    property.purchaseDate,
    taxYear
  );
}

/**
 * Calculate total expenses (Schedule E Line 20)
 */
export function calculateTotalExpenses(expenses: ScheduleEExpenses): number {
  const total =
    expenses.advertising +
    expenses.autoAndTravel +
    expenses.cleaningAndMaintenance +
    expenses.commissions +
    expenses.insurance +
    expenses.legal +
    expenses.managementFees +
    expenses.mortgageInterest +
    expenses.otherInterest +
    expenses.repairs +
    expenses.supplies +
    expenses.taxes +
    expenses.utilities +
    expenses.depreciation +
    expenses.other;

  return Math.round(total * 100) / 100;
}

/**
 * Calculate net income/loss (Schedule E Line 21)
 */
export function calculateNetIncome(
  income: ScheduleEIncome,
  totalExpenses: number
): number {
  const net = income.rentalIncome - totalExpenses;
  return Math.round(net * 100) / 100;
}

/**
 * Generate complete Schedule E data for a single property
 */
export function generateScheduleEData(
  property: ScheduleEProperty,
  taxYear: number,
  incomeEntries: Array<{
    amount: number;
    frequency: "monthly" | "quarterly" | "annual" | "one_time";
    description?: string;
  }>,
  expenses: Array<{
    category: string;
    amount: number;
  }>
): ScheduleEData {
  // Calculate income
  const income = calculateScheduleEIncome(incomeEntries);

  // Calculate expenses
  const scheduleExpenses = calculateScheduleEExpenses(expenses);

  // Calculate depreciation
  const depreciation = calculateDepreciation(property, taxYear);
  scheduleExpenses.depreciation = depreciation;

  // Calculate totals
  const totalExpenses = calculateTotalExpenses(scheduleExpenses);
  const netIncome = calculateNetIncome(income, totalExpenses);

  return {
    property,
    taxYear,
    income,
    expenses: scheduleExpenses,
    totals: {
      totalExpenses,
      netIncome,
    },
    depreciation: {
      depreciableBasis: calculateDepreciableBasis(
        property.purchasePrice,
        property.landValue
      ),
      monthPlacedInService: new Date(property.purchaseDate).getMonth() + 1,
      priorYearDepreciation: 0, // TODO: Calculate from previous years
      currentYearDepreciation: depreciation,
    },
  };
}

/**
 * Generate Schedule E summary for multiple properties
 */
export function generateScheduleESummary(
  propertiesData: ScheduleEData[]
): ScheduleESummary {
  if (propertiesData.length === 0) {
    throw new Error("No properties provided for Schedule E summary");
  }

  const taxYear = propertiesData[0].taxYear;

  // Ensure all properties are for the same tax year
  const invalidProperties = propertiesData.filter(p => p.taxYear !== taxYear);
  if (invalidProperties.length > 0) {
    throw new Error(`All properties must be for the same tax year. Found properties for years: ${[...new Set(propertiesData.map(p => p.taxYear))].join(", ")}`);
  }

  // Calculate totals across all properties
  const totals = propertiesData.reduce(
    (acc, property) => {
      acc.totalIncome += property.income.rentalIncome;
      acc.totalExpenses += property.totals.totalExpenses;
      acc.totalDepreciation += property.expenses.depreciation;
      acc.netIncome += property.totals.netIncome;
      return acc;
    },
    {
      totalIncome: 0,
      totalExpenses: 0,
      totalDepreciation: 0,
      netIncome: 0,
    }
  );

  // Round totals to 2 decimal places
  Object.keys(totals).forEach((key) => {
    totals[key as keyof typeof totals] = Math.round(totals[key as keyof typeof totals] * 100) / 100;
  });

  return {
    taxYear,
    properties: propertiesData,
    totals,
  };
}

/**
 * Format currency for display in Schedule E
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency for tax forms (no symbol, with commas)
 */
export function formatTaxAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Enhanced portfolio metrics for CDO analysis
 */
export interface EnhancedPortfolioMetrics {
  netCashFlow: number;           // Actual money in pocket (excludes depreciation)
  taxImpact: number;             // Schedule E net income/loss (includes depreciation)
  operatingCashFlow: number;     // Revenue - operating expenses (excludes depreciation and interest)
  cashOnCashReturn: number;      // Cash flow / cash invested (annual percentage)
  portfolioROI: number;          // Annual return on investment
  expenseRatio: number;          // Operating expenses / income
  availableDepreciation: number; // Total depreciation deductions taken
  operatingExpenses: number;     // Total expenses excluding depreciation
  depreciationAmount: number;    // Total depreciation across portfolio
}

/**
 * Calculate cash flow vs tax impact breakdown
 */
export function calculateCashFlowBreakdown(summary: ScheduleESummary): {
  netCashFlow: number;
  depreciationBenefit: number;
  taxImpact: number;
  operatingProfit: number;
} {
  const depreciationAmount = summary.totals.totalDepreciation;
  const taxImpact = summary.totals.netIncome; // Includes depreciation
  const netCashFlow = taxImpact + depreciationAmount; // Add back non-cash depreciation
  const operatingProfit = summary.totals.totalIncome - (summary.totals.totalExpenses - depreciationAmount);

  return {
    netCashFlow: Math.round(netCashFlow * 100) / 100,
    depreciationBenefit: Math.round(depreciationAmount * 100) / 100,
    taxImpact: Math.round(taxImpact * 100) / 100,
    operatingProfit: Math.round(operatingProfit * 100) / 100,
  };
}

/**
 * Calculate enhanced portfolio metrics for CDO dashboard
 */
export function calculateEnhancedPortfolioMetrics(
  summary: ScheduleESummary,
  totalInvestment: number // Total purchase price across all properties
): EnhancedPortfolioMetrics {
  const cashFlowBreakdown = calculateCashFlowBreakdown(summary);
  const totalIncome = summary.totals.totalIncome;
  const operatingExpenses = summary.totals.totalExpenses - summary.totals.totalDepreciation;

  // Calculate returns
  const portfolioROI = totalInvestment > 0 ? (cashFlowBreakdown.netCashFlow / totalInvestment) * 100 : 0;
  const expenseRatio = totalIncome > 0 ? (operatingExpenses / totalIncome) * 100 : 0;

  // Cash-on-cash return (assuming 20% down payment for financed properties)
  const estimatedCashInvested = totalInvestment * 0.25; // Conservative estimate
  const cashOnCashReturn = estimatedCashInvested > 0 ? (cashFlowBreakdown.netCashFlow / estimatedCashInvested) * 100 : 0;

  return {
    netCashFlow: cashFlowBreakdown.netCashFlow,
    taxImpact: cashFlowBreakdown.taxImpact,
    operatingCashFlow: cashFlowBreakdown.operatingProfit,
    cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
    portfolioROI: Math.round(portfolioROI * 100) / 100,
    expenseRatio: Math.round(expenseRatio * 100) / 100,
    availableDepreciation: summary.totals.totalDepreciation,
    operatingExpenses: Math.round(operatingExpenses * 100) / 100,
    depreciationAmount: summary.totals.totalDepreciation,
  };
}

/**
 * Calculate property-level performance metrics
 */
export interface PropertyPerformanceMetrics {
  monthlyNetCashFlow: number;
  annualROI: number;
  expenseRatio: number;
  isProfit: boolean;
  profitability: 'excellent' | 'good' | 'break-even' | 'loss';
  recommendedAction?: string;
}

export function calculatePropertyPerformance(
  data: ScheduleEData,
  purchasePrice: number
): PropertyPerformanceMetrics {
  const cashFlowBreakdown = calculateCashFlowBreakdown({
    taxYear: data.taxYear,
    properties: [data],
    totals: {
      totalIncome: data.income.rentalIncome,
      totalExpenses: data.totals.totalExpenses,
      totalDepreciation: data.expenses.depreciation,
      netIncome: data.totals.netIncome,
    },
  });

  const monthlyNetCashFlow = cashFlowBreakdown.netCashFlow / 12;
  const annualROI = purchasePrice > 0 ? (cashFlowBreakdown.netCashFlow / purchasePrice) * 100 : 0;
  const expenseRatio = data.income.rentalIncome > 0 ?
    ((data.totals.totalExpenses - data.expenses.depreciation) / data.income.rentalIncome) * 100 : 0;

  const isProfit = cashFlowBreakdown.netCashFlow > 0;

  // Determine profitability level
  let profitability: PropertyPerformanceMetrics['profitability'];
  let recommendedAction: string | undefined;

  if (annualROI >= 8) {
    profitability = 'excellent';
  } else if (annualROI >= 4) {
    profitability = 'good';
  } else if (annualROI >= -2) {
    profitability = 'break-even';
    recommendedAction = 'Consider rent increase or expense reduction';
  } else {
    profitability = 'loss';
    recommendedAction = 'Review pricing and expenses urgently';
  }

  return {
    monthlyNetCashFlow: Math.round(monthlyNetCashFlow * 100) / 100,
    annualROI: Math.round(annualROI * 100) / 100,
    expenseRatio: Math.round(expenseRatio * 100) / 100,
    isProfit,
    profitability,
    recommendedAction,
  };
}

/**
 * Validate Schedule E data for common errors
 */
export function validateScheduleEData(data: ScheduleEData): string[] {
  const errors: string[] = [];

  // Check for negative income (unusual)
  if (data.income.rentalIncome < 0) {
    errors.push("Rental income should typically be positive");
  }

  // Check for zero depreciation on non-cash purchases
  if (data.expenses.depreciation === 0 && data.expenses.mortgageInterest > 0) {
    errors.push("Expected depreciation expense for financed property");
  }

  // Check for unusually high expense ratios
  const expenseRatio = data.totals.totalExpenses / data.income.rentalIncome;
  if (expenseRatio > 1.5) {
    errors.push("Expenses exceed 150% of income - verify accuracy");
  }

  // Check for missing required property information
  if (!data.property.address.street || !data.property.address.city) {
    errors.push("Property address is incomplete");
  }

  return errors;
}