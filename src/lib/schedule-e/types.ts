/**
 * TypeScript interfaces for Schedule E (Form 1040) data structures
 * Based on IRS Schedule E - Supplemental Income and Loss
 */

/**
 * Property information for Schedule E reporting
 */
export interface ScheduleEProperty {
  id: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  propertyType: string;
  purchaseDate: string;
  purchasePrice: number;
  landValue: number;
}

/**
 * Income data for Schedule E
 */
export interface ScheduleEIncome {
  rentalIncome: number; // Line 3
  royalties?: number;   // Line 4 (future use)
}

/**
 * Expense data mapped to Schedule E lines
 */
export interface ScheduleEExpenses {
  advertising: number;              // Line 5
  autoAndTravel: number;           // Line 6
  cleaningAndMaintenance: number;  // Line 7
  commissions: number;             // Line 8
  insurance: number;               // Line 9
  legal: number;                   // Line 10
  managementFees: number;          // Line 11
  mortgageInterest: number;        // Line 12
  otherInterest: number;           // Line 13
  repairs: number;                 // Line 14
  supplies: number;                // Line 15
  taxes: number;                   // Line 16
  utilities: number;               // Line 17
  depreciation: number;            // Line 18
  other: number;                   // Line 19
}

/**
 * Complete Schedule E data for a single property
 */
export interface ScheduleEData {
  property: ScheduleEProperty;
  taxYear: number;
  income: ScheduleEIncome;
  expenses: ScheduleEExpenses;
  totals: {
    totalExpenses: number;    // Line 20
    netIncome: number;        // Line 21 (can be negative for loss)
  };
  depreciation?: {
    depreciableBasis: number;
    monthPlacedInService: number;
    priorYearDepreciation: number;
    currentYearDepreciation: number;
  };
}

/**
 * Multi-property Schedule E summary
 */
export interface ScheduleESummary {
  taxYear: number;
  properties: ScheduleEData[];
  totals: {
    totalIncome: number;
    totalExpenses: number;
    totalDepreciation: number;
    netIncome: number;
  };
}

/**
 * Mapping of expense categories to Schedule E line numbers
 */
export const SCHEDULE_E_LINE_MAPPING: Record<string, { line: number; label: string }> = {
  advertising: { line: 5, label: "Advertising" },
  auto_travel: { line: 6, label: "Auto and travel" },
  cleaning_maintenance: { line: 7, label: "Cleaning and maintenance" },
  commissions: { line: 8, label: "Commissions" },
  insurance: { line: 9, label: "Insurance" },
  legal_professional: { line: 10, label: "Legal and other professional fees" },
  management_fees: { line: 11, label: "Management fees" },
  mortgage_interest: { line: 12, label: "Mortgage interest paid to banks, etc." },
  other_interest: { line: 13, label: "Other interest" },
  repairs: { line: 14, label: "Repairs" },
  supplies: { line: 15, label: "Supplies" },
  property_taxes: { line: 16, label: "Taxes" },
  utilities: { line: 17, label: "Utilities" },
  // Line 18 (Depreciation) is calculated, not from expenses table
  other: { line: 19, label: "Other" },
};

/**
 * Export format options for Schedule E data
 */
export type ScheduleEExportFormat = 'pdf' | 'csv' | 'turbotax' | 'quickbooks';

/**
 * CSV export configuration for different tax software
 */
export interface CSVExportConfig {
  format: ScheduleEExportFormat;
  headers: string[];
  includePropertyDetails: boolean;
  includeDepreciationSchedule: boolean;
}

/**
 * API request/response types for Schedule E endpoints
 */
export interface ScheduleERequest {
  propertyId?: string;
  taxYear: number;
  includeAllProperties?: boolean;
}

export interface ScheduleEResponse {
  success: boolean;
  data?: ScheduleEData | ScheduleESummary;
  error?: string;
}