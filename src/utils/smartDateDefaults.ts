/**
 * Smart date defaults for tax data entry based on frequency and tax year
 */

export type FrequencyType = 'one-time' | 'monthly' | 'quarterly' | 'annual';

export interface SmartDateOptions {
  frequency: FrequencyType;
  taxYear: number;
}

/**
 * Generate smart date defaults based on frequency and tax year
 */
export function getSmartDateDefault({ frequency, taxYear }: SmartDateOptions): string {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  switch (frequency) {
    case 'annual':
    case 'one-time':
      // Default to December 31st of the selected tax year
      return `${taxYear}-12-31`;

    case 'quarterly': {
      // Default to end of previous quarter in the selected tax year
      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, we want 1-12

      // Determine which quarter we're in and get the previous quarter
      let quarterEndMonth: number;

      if (currentMonth <= 3) {
        // Q1 (Jan-Mar) -> Previous Q4 of selected tax year
        quarterEndMonth = 12;
      } else if (currentMonth <= 6) {
        // Q2 (Apr-Jun) -> Previous Q1 of selected tax year
        quarterEndMonth = 3;
      } else if (currentMonth <= 9) {
        // Q3 (Jul-Sep) -> Previous Q2 of selected tax year
        quarterEndMonth = 6;
      } else {
        // Q4 (Oct-Dec) -> Previous Q3 of selected tax year
        quarterEndMonth = 9;
      }

      // Get the last day of the quarter end month
      const lastDayOfQuarter = new Date(taxYear, quarterEndMonth, 0).getDate();
      return `${taxYear}-${quarterEndMonth.toString().padStart(2, '0')}-${lastDayOfQuarter}`;
    }

    case 'monthly': {
      // Default to end of previous month
      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, we want 1-12

      let previousMonth: number;
      let yearToUse: number;

      if (currentMonth === 1) {
        // January -> December of previous year
        previousMonth = 12;
        yearToUse = currentYear - 1;
      } else {
        // Any other month -> previous month of current year
        previousMonth = currentMonth - 1;
        yearToUse = currentYear;
      }

      // However, if the selected tax year is different from current year,
      // use the tax year but still apply the previous month logic relative to current date
      if (taxYear !== currentYear) {
        yearToUse = taxYear;
        // For past tax years, default to December (end of year)
        // For future tax years, default to January
        if (taxYear < currentYear) {
          previousMonth = 12;
        } else {
          previousMonth = 1;
        }
      }

      // Get the last day of the previous month
      const lastDayOfMonth = new Date(yearToUse, previousMonth, 0).getDate();
      return `${yearToUse}-${previousMonth.toString().padStart(2, '0')}-${lastDayOfMonth}`;
    }

    default:
      // Fallback to end of selected tax year
      return `${taxYear}-12-31`;
  }
}

/**
 * Update date when frequency changes
 */
export function updateDateForFrequencyChange(
  currentDate: string,
  newFrequency: FrequencyType,
  taxYear: number
): string {
  // If the current date is already set to something reasonable, keep it
  // Otherwise, generate a new smart default
  const currentDateObj = new Date(currentDate);
  const currentYear = currentDateObj.getFullYear();

  // If the current date is in the wrong year, generate a new default
  if (currentYear !== taxYear) {
    return getSmartDateDefault({ frequency: newFrequency, taxYear });
  }

  // If changing to annual/one-time and current date isn't end of year, update it
  if ((newFrequency === 'annual' || newFrequency === 'one-time') &&
      (currentDateObj.getMonth() !== 11 || currentDateObj.getDate() !== 31)) {
    return `${taxYear}-12-31`;
  }

  // For quarterly/monthly, if the current date seems reasonable (end of month/quarter), keep it
  // Otherwise generate a new default
  const isEndOfMonth = currentDateObj.getDate() === new Date(currentYear, currentDateObj.getMonth() + 1, 0).getDate();

  if ((newFrequency === 'quarterly' || newFrequency === 'monthly') && !isEndOfMonth) {
    return getSmartDateDefault({ frequency: newFrequency, taxYear });
  }

  // Otherwise, keep the current date
  return currentDate;
}

/**
 * Get human-readable explanation for the date default
 */
export function getDateDefaultExplanation(frequency: FrequencyType, taxYear: number): string {
  switch (frequency) {
    case 'annual':
    case 'one-time':
      return `Defaulted to end of ${taxYear} (Dec 31)`;
    case 'quarterly':
      return 'Defaulted to end of previous quarter';
    case 'monthly':
      return 'Defaulted to end of previous month';
    default:
      return `Defaulted to end of ${taxYear}`;
  }
}