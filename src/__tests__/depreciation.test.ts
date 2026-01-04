import { describe, it, expect } from "vitest";

/**
 * IRS Mid-Month Convention Depreciation Calculator
 * For 27.5-year residential rental property
 */

// First year percentages based on month placed in service (IRS Table)
const FIRST_YEAR_PERCENTAGES: Record<number, number> = {
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

const SUBSEQUENT_YEAR_PERCENTAGE = 3.636;
// const DEPRECIATION_YEARS = 27.5; // Used for reference only

interface DepreciationResult {
  year: number;
  amount: number;
  percentage: number;
  accumulatedDepreciation: number;
  remainingBasis: number;
}

function calculateDepreciableBasis(
  purchasePrice: number,
  landValue: number
): number {
  return purchasePrice - landValue;
}

function calculateFirstYearDepreciation(
  depreciableBasis: number,
  monthPlacedInService: number
): number {
  const percentage = FIRST_YEAR_PERCENTAGES[monthPlacedInService];
  if (!percentage) {
    throw new Error(`Invalid month: ${monthPlacedInService}`);
  }
  return Math.round((depreciableBasis * percentage) / 100 * 100) / 100;
}

function calculateAnnualDepreciation(depreciableBasis: number): number {
  return Math.round((depreciableBasis * SUBSEQUENT_YEAR_PERCENTAGE) / 100 * 100) / 100;
}

function calculateDepreciationSchedule(
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

describe("Depreciation Calculator", () => {
  describe("calculateDepreciableBasis", () => {
    it("should subtract land value from purchase price", () => {
      expect(calculateDepreciableBasis(300000, 60000)).toBe(240000);
    });

    it("should handle zero land value", () => {
      expect(calculateDepreciableBasis(300000, 0)).toBe(300000);
    });
  });

  describe("calculateFirstYearDepreciation", () => {
    it("should calculate January placement correctly (3.485%)", () => {
      const result = calculateFirstYearDepreciation(240000, 1);
      expect(result).toBe(8364); // 240000 * 0.03485 = 8364
    });

    it("should calculate July placement correctly (1.667%)", () => {
      const result = calculateFirstYearDepreciation(240000, 7);
      expect(result).toBe(4000.8); // 240000 * 0.01667 = 4000.8
    });

    it("should calculate December placement correctly (0.152%)", () => {
      const result = calculateFirstYearDepreciation(240000, 12);
      expect(result).toBe(364.8); // 240000 * 0.00152 = 364.8
    });

    it("should throw error for invalid month", () => {
      expect(() => calculateFirstYearDepreciation(240000, 13)).toThrow("Invalid month");
      expect(() => calculateFirstYearDepreciation(240000, 0)).toThrow("Invalid month");
    });
  });

  describe("calculateAnnualDepreciation", () => {
    it("should calculate 3.636% of depreciable basis", () => {
      const result = calculateAnnualDepreciation(240000);
      expect(result).toBe(8726.4); // 240000 * 0.03636 = 8726.4
    });
  });

  describe("calculateDepreciationSchedule", () => {
    it("should generate correct multi-year schedule", () => {
      const schedule = calculateDepreciationSchedule(300000, 60000, 1, 3);

      expect(schedule).toHaveLength(3);

      // Year 1: January placement (3.485%)
      expect(schedule[0].year).toBe(1);
      expect(schedule[0].amount).toBe(8364);
      expect(schedule[0].percentage).toBe(3.485);

      // Year 2: Standard (3.636%)
      expect(schedule[1].year).toBe(2);
      expect(schedule[1].amount).toBe(8726.4);
      expect(schedule[1].percentage).toBe(3.636);

      // Year 3: Standard (3.636%)
      expect(schedule[2].year).toBe(3);
      expect(schedule[2].amount).toBe(8726.4);
    });

    it("should track accumulated depreciation correctly", () => {
      const schedule = calculateDepreciationSchedule(300000, 60000, 1, 3);

      expect(schedule[0].accumulatedDepreciation).toBe(8364);
      expect(schedule[1].accumulatedDepreciation).toBe(8364 + 8726.4);
      expect(schedule[2].accumulatedDepreciation).toBe(8364 + 8726.4 * 2);
    });

    it("should calculate remaining basis correctly", () => {
      const schedule = calculateDepreciationSchedule(300000, 60000, 1, 2);
      const depreciableBasis = 240000;

      expect(schedule[0].remainingBasis).toBe(depreciableBasis - 8364);
      expect(schedule[1].remainingBasis).toBe(depreciableBasis - 8364 - 8726.4);
    });
  });
});

// Export for use in the app
export {
  calculateDepreciableBasis,
  calculateFirstYearDepreciation,
  calculateAnnualDepreciation,
  calculateDepreciationSchedule,
  FIRST_YEAR_PERCENTAGES,
  SUBSEQUENT_YEAR_PERCENTAGE,
  type DepreciationResult,
};
