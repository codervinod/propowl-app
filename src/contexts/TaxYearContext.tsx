"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface TaxYearContextType {
  selectedTaxYear: number;
  setSelectedTaxYear: (year: number) => void;
  isLoading: boolean;
}

const TaxYearContext = createContext<TaxYearContextType | undefined>(undefined);

interface TaxYearProviderProps {
  children: React.ReactNode;
}

export function TaxYearProvider({ children }: TaxYearProviderProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Default to previous year for tax season workflow
  // Most users work on previous year's tax data
  const currentYear = new Date().getFullYear();
  const defaultTaxYear = currentYear - 1; // e.g., 2025 in 2026

  const [selectedTaxYear, setSelectedTaxYearState] = useState(defaultTaxYear);

  // Load saved tax year from localStorage on mount
  useEffect(() => {
    const savedTaxYear = localStorage.getItem("propowl-selected-tax-year");
    if (savedTaxYear) {
      const year = parseInt(savedTaxYear, 10);
      // Validate the year is reasonable (between 2020 and current year + 1)
      if (year >= 2020 && year <= currentYear + 1) {
        setSelectedTaxYearState(year);
      }
    }
    setIsLoading(false);
  }, [currentYear]);

  // Save tax year to localStorage when it changes
  const setSelectedTaxYear = (year: number) => {
    setSelectedTaxYearState(year);
    localStorage.setItem("propowl-selected-tax-year", year.toString());
  };

  const value: TaxYearContextType = {
    selectedTaxYear,
    setSelectedTaxYear,
    isLoading,
  };

  return (
    <TaxYearContext.Provider value={value}>
      {children}
    </TaxYearContext.Provider>
  );
}

export function useTaxYear(): TaxYearContextType {
  const context = useContext(TaxYearContext);
  if (context === undefined) {
    throw new Error("useTaxYear must be used within a TaxYearProvider");
  }
  return context;
}