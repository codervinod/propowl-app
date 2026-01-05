"use client";

import useSWR from "swr";
import { ScheduleESummary, ScheduleEData } from "@/lib/schedule-e/types";
// Note: Enhanced calculations are imported directly in components where needed

interface PortfolioDataResponse {
  success: boolean;
  data: ScheduleESummary;
  error?: string;
}

const fetcher = async (url: string): Promise<ScheduleESummary> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: PortfolioDataResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to fetch portfolio data");
  }

  return result.data;
};

export function usePortfolioData(taxYear: number) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/schedule-e?includeAllProperties=true&taxYear=${taxYear}`,
    fetcher,
    {
      // Cache for 5 minutes for better dashboard performance
      refreshInterval: 5 * 60 * 1000,
      // Revalidate when window gets focus
      revalidateOnFocus: true,
      // Don't retry too aggressively on errors
      errorRetryCount: 2,
      errorRetryInterval: 5000,
      // Keep data while revalidating for smooth UX
      keepPreviousData: true,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate, // Allow manual refresh
  };
}

interface PropertyDataResponse {
  success: boolean;
  data: ScheduleEData;
  error?: string;
}

const propertyFetcher = async (url: string): Promise<ScheduleEData> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: PropertyDataResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to fetch property data");
  }

  return result.data;
};

export function usePropertyPerformance(propertyId: string, taxYear: number) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/schedule-e?propertyId=${propertyId}&taxYear=${taxYear}`,
    propertyFetcher,
    {
      // Cache for 5 minutes
      refreshInterval: 5 * 60 * 1000,
      revalidateOnFocus: true,
      errorRetryCount: 2,
      errorRetryInterval: 5000,
      keepPreviousData: true,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}