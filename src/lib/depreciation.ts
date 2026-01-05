/**
 * IRS Mid-Month Convention Depreciation Calculator
 * For 27.5-year residential rental property
 *
 * Based on IRS Publication 527 and depreciation tables
 */

// First year percentages based on month placed in service (IRS Table)
export const FIRST_YEAR_PERCENTAGES: Record<number, number> = {
  1: 3.485,  // January
  2: 3.182,  // February
  3: 2.879,  // March
  4: 2.576,  // April
  5: 2.273,  // May
  6: 1.97,   // June
  7: 1.667,  // July
  8: 1.364,  // August
  9: 1.061,  // September
  10: 0.758, // October
  11: 0.455, // November
  12: 0.152, // December
};

export const SUBSEQUENT_YEAR_PERCENTAGE = 3.636;
export const DEPRECIATION_YEARS = 27.5;

export interface DepreciationResult {
  year: number;
  amount: number;
  percentage: number;
  accumulatedDepreciation: number;
  remainingBasis: number;
}

/**
 * Calculate the depreciable basis for a rental property
 * @param purchasePrice Total purchase price of the property
 * @param landValue Value of the land (not depreciable)
 * @returns Depreciable basis (purchase price minus land value)
 */
export function calculateDepreciableBasis(
  purchasePrice: number,
  landValue: number
): number {
  return purchasePrice - landValue;
}

/**
 * Calculate first year depreciation using IRS mid-month convention
 * @param depreciableBasis The depreciable basis of the property
 * @param monthPlacedInService Month the property was placed in service (1-12)
 * @returns First year depreciation amount
 */
export function calculateFirstYearDepreciation(
  depreciableBasis: number,
  monthPlacedInService: number
): number {
  const percentage = FIRST_YEAR_PERCENTAGES[monthPlacedInService];
  if (!percentage) {
    throw new Error(`Invalid month: ${monthPlacedInService}. Must be 1-12.`);
  }
  return Math.round((depreciableBasis * percentage) / 100 * 100) / 100;
}

/**
 * Calculate annual depreciation for years 2-27
 * @param depreciableBasis The depreciable basis of the property
 * @returns Annual depreciation amount (3.636% of basis)
 */
export function calculateAnnualDepreciation(depreciableBasis: number): number {
  return Math.round((depreciableBasis * SUBSEQUENT_YEAR_PERCENTAGE) / 100 * 100) / 100;
}

/**
 * Calculate depreciation schedule for multiple years
 * @param purchasePrice Total purchase price of the property
 * @param landValue Value of the land (not depreciable)
 * @param monthPlacedInService Month the property was placed in service (1-12)
 * @param yearsToCalculate Number of years to calculate (default: 5)
 * @returns Array of depreciation results for each year
 */
export function calculateDepreciationSchedule(
  purchasePrice: number,
  landValue: number,
  monthPlacedInService: number,
  yearsToCalculate: number = 5
): DepreciationResult[] {
  const depreciableBasis = calculateDepreciableBasis(purchasePrice, landValue);
  const results: DepreciationResult[] = [];
  let accumulatedDepreciation = 0;

  for (let year = 1; year <= yearsToCalculate; year++) {
    let amount: number;
    let percentage: number;

    if (year === 1) {
      percentage = FIRST_YEAR_PERCENTAGES[monthPlacedInService];
      amount = calculateFirstYearDepreciation(depreciableBasis, monthPlacedInService);
    } else {
      percentage = SUBSEQUENT_YEAR_PERCENTAGE;
      amount = calculateAnnualDepreciation(depreciableBasis);
    }

    accumulatedDepreciation += amount;

    results.push({
      year,
      amount,
      percentage,
      accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
      remainingBasis: Math.round((depreciableBasis - accumulatedDepreciation) * 100) / 100,
    });
  }

  return results;
}

/**
 * Calculate depreciation for a specific tax year
 * @param purchasePrice Total purchase price of the property
 * @param landValue Value of the land (not depreciable)
 * @param purchaseDate Date the property was purchased (used for first year calculation)
 * @param taxYear The tax year to calculate depreciation for
 * @returns Depreciation amount for the specified tax year
 */
export function calculateDepreciationForTaxYear(
  purchasePrice: number,
  landValue: number,
  purchaseDate: string, // YYYY-MM-DD format
  taxYear: number
): number {
  const purchaseDateObj = new Date(purchaseDate);
  const purchaseYear = purchaseDateObj.getFullYear();
  const monthPlacedInService = purchaseDateObj.getMonth() + 1; // getMonth() is 0-based

  const yearsSincePurchase = taxYear - purchaseYear + 1;

  if (yearsSincePurchase < 1) {
    return 0; // Property not yet purchased
  }

  const depreciableBasis = calculateDepreciableBasis(purchasePrice, landValue);

  if (yearsSincePurchase === 1) {
    // First year - use mid-month convention
    return calculateFirstYearDepreciation(depreciableBasis, monthPlacedInService);
  } else if (yearsSincePurchase <= 28) {
    // Years 2-28 - use standard percentage
    return calculateAnnualDepreciation(depreciableBasis);
  } else {
    // Property fully depreciated
    return 0;
  }
}