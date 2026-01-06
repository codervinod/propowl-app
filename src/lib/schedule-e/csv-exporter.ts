/**
 * CSV Export utilities for Schedule E data
 * Supports multiple formats for tax software integration
 */

import {
  ScheduleEData,
  ScheduleESummary,
  CSVExportConfig,
  ScheduleEExportFormat,
} from "./types";
import { formatTaxAmount } from "./calculations";

/**
 * Default CSV export configurations for different tax software
 */
const CSV_CONFIGS: Record<ScheduleEExportFormat, CSVExportConfig> = {
  pdf: {
    format: "pdf",
    headers: ["Line", "Description", "Amount"],
    includePropertyDetails: true,
    includeDepreciationSchedule: true,
  },
  csv: {
    format: "csv",
    headers: [
      "Property Address",
      "Tax Year",
      "Rental Income",
      "Total Expenses",
      "Depreciation",
      "Net Income",
    ],
    includePropertyDetails: true,
    includeDepreciationSchedule: false,
  },
  turbotax: {
    format: "turbotax",
    headers: [
      "Property_Address",
      "Rental_Income_Line3",
      "Advertising_Line5",
      "Auto_Travel_Line6",
      "Cleaning_Maintenance_Line7",
      "Commissions_Line8",
      "Insurance_Line9",
      "Legal_Professional_Line10",
      "Management_Fees_Line11",
      "Mortgage_Interest_Line12",
      "Other_Interest_Line13",
      "Repairs_Line14",
      "Supplies_Line15",
      "Taxes_Line16",
      "Utilities_Line17",
      "Depreciation_Line18",
      "Other_Line19",
      "Total_Expenses_Line20",
      "Net_Income_Line21",
    ],
    includePropertyDetails: true,
    includeDepreciationSchedule: false,
  },
  quickbooks: {
    format: "quickbooks",
    headers: [
      "Property",
      "Account",
      "Amount",
      "Description",
      "Tax Year",
    ],
    includePropertyDetails: false,
    includeDepreciationSchedule: false,
  },
};

/**
 * Export single property Schedule E data to CSV
 */
export function exportPropertyToCSV(
  data: ScheduleEData,
  format: ScheduleEExportFormat = "csv"
): string {
  const config = CSV_CONFIGS[format];
  // Property address for potential future use
  // const propertyAddress = `${data.property.address.street}${data.property.address.streetLine2 ? `, ${data.property.address.streetLine2}` : ''}, ${data.property.address.city}, ${data.property.address.state}`;

  switch (format) {
    case "turbotax":
      return exportToTurboTaxFormat(data);

    case "quickbooks":
      return exportToQuickBooksFormat(data);

    case "csv":
    default:
      return exportToStandardCSV([data], config);
  }
}

/**
 * Export multiple properties Schedule E summary to CSV
 */
export function exportSummaryToCSV(
  summary: ScheduleESummary,
  format: ScheduleEExportFormat = "csv"
): string {
  const config = CSV_CONFIGS[format];

  switch (format) {
    case "turbotax":
      return summary.properties.map(p => exportToTurboTaxFormat(p)).join('\n');

    case "quickbooks":
      return summary.properties.map(p => exportToQuickBooksFormat(p)).join('\n');

    case "csv":
    default:
      return exportToStandardCSV(summary.properties, config);
  }
}

/**
 * Export to standard CSV format (readable summary)
 */
function exportToStandardCSV(
  properties: ScheduleEData[],
  config: CSVExportConfig
): string {
  const rows: string[] = [];

  // Add header row
  rows.push(config.headers.join(","));

  // Add property data rows
  properties.forEach((property) => {
    const address = `"${property.property.address.street}${property.property.address.streetLine2 ? `, ${property.property.address.streetLine2}` : ''}, ${property.property.address.city}, ${property.property.address.state}"`;
    const row = [
      address,
      property.taxYear.toString(),
      formatTaxAmount(property.income.rentalIncome),
      formatTaxAmount(property.totals.totalExpenses),
      formatTaxAmount(property.expenses.depreciation),
      formatTaxAmount(property.totals.netIncome),
    ];
    rows.push(row.join(","));
  });

  return rows.join("\n");
}

/**
 * Export to TurboTax compatible format
 */
function exportToTurboTaxFormat(data: ScheduleEData): string {
  const config = CSV_CONFIGS.turbotax;
  const address = `"${data.property.address.street}${data.property.address.streetLine2 ? `, ${data.property.address.streetLine2}` : ''}, ${data.property.address.city}, ${data.property.address.state}"`;

  // Header row (only include once)
  const headerRow = config.headers.join(",");

  // Data row
  const dataRow = [
    address,
    formatTaxAmount(data.income.rentalIncome),           // Line 3
    formatTaxAmount(data.expenses.advertising),          // Line 5
    formatTaxAmount(data.expenses.autoAndTravel),        // Line 6
    formatTaxAmount(data.expenses.cleaningAndMaintenance), // Line 7
    formatTaxAmount(data.expenses.commissions),          // Line 8
    formatTaxAmount(data.expenses.insurance),            // Line 9
    formatTaxAmount(data.expenses.legal),                // Line 10
    formatTaxAmount(data.expenses.managementFees),       // Line 11
    formatTaxAmount(data.expenses.mortgageInterest),     // Line 12
    formatTaxAmount(data.expenses.otherInterest),        // Line 13
    formatTaxAmount(data.expenses.repairs),              // Line 14
    formatTaxAmount(data.expenses.supplies),             // Line 15
    formatTaxAmount(data.expenses.taxes),                // Line 16
    formatTaxAmount(data.expenses.utilities),            // Line 17
    formatTaxAmount(data.expenses.depreciation),         // Line 18
    formatTaxAmount(data.expenses.other),                // Line 19
    formatTaxAmount(data.totals.totalExpenses),          // Line 20
    formatTaxAmount(data.totals.netIncome),              // Line 21
  ].join(",");

  return `${headerRow}\n${dataRow}`;
}

/**
 * Export to QuickBooks compatible format (detailed transactions)
 */
function exportToQuickBooksFormat(data: ScheduleEData): string {
  const rows: string[] = [];
  const address = `"${data.property.address.street}${data.property.address.streetLine2 ? `, ${data.property.address.streetLine2}` : ''}, ${data.property.address.city}, ${data.property.address.state}"`;

  // Header row (only include once)
  rows.push(CSV_CONFIGS.quickbooks.headers.join(","));

  // Income row
  if (data.income.rentalIncome > 0) {
    rows.push([
      address,
      "Rental Income",
      formatTaxAmount(data.income.rentalIncome),
      "Rental income collected",
      data.taxYear.toString(),
    ].join(","));
  }

  // Expense rows
  const expenseEntries = [
    { account: "Advertising", amount: data.expenses.advertising },
    { account: "Auto & Travel", amount: data.expenses.autoAndTravel },
    { account: "Cleaning & Maintenance", amount: data.expenses.cleaningAndMaintenance },
    { account: "Commissions", amount: data.expenses.commissions },
    { account: "Insurance", amount: data.expenses.insurance },
    { account: "Legal & Professional", amount: data.expenses.legal },
    { account: "Management Fees", amount: data.expenses.managementFees },
    { account: "Mortgage Interest", amount: data.expenses.mortgageInterest },
    { account: "Other Interest", amount: data.expenses.otherInterest },
    { account: "Repairs", amount: data.expenses.repairs },
    { account: "Supplies", amount: data.expenses.supplies },
    { account: "Property Taxes", amount: data.expenses.taxes },
    { account: "Utilities", amount: data.expenses.utilities },
    { account: "Depreciation", amount: data.expenses.depreciation },
    { account: "Other Expenses", amount: data.expenses.other },
  ];

  expenseEntries.forEach((entry) => {
    if (entry.amount > 0) {
      rows.push([
        address,
        entry.account,
        formatTaxAmount(-entry.amount), // Negative for expenses
        `${entry.account} expense`,
        data.taxYear.toString(),
      ].join(","));
    }
  });

  return rows.join("\n");
}

/**
 * Generate downloadable CSV file blob
 */
export function createCSVDownload(
  csvContent: string,
  filename: string = "schedule-e-export.csv"
): { blob: Blob; url: string; filename: string } {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    filename,
  };
}

/**
 * Generate filename for CSV export based on data
 */
export function generateCSVFilename(
  data: ScheduleEData | ScheduleESummary,
  format: ScheduleEExportFormat
): string {
  let taxYear: number;
  let isMultiple: boolean;

  if ("properties" in data) {
    // ScheduleESummary
    taxYear = data.taxYear;
    isMultiple = data.properties.length > 1;
  } else {
    // ScheduleEData
    taxYear = data.taxYear;
    isMultiple = false;
  }

  const base = isMultiple ? "schedule-e-summary" : "schedule-e-property";
  const formatSuffix = format === "csv" ? "" : `-${format}`;

  return `${base}-${taxYear}${formatSuffix}.csv`;
}