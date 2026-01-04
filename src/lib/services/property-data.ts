import { AddressComponents } from "@/components/property/AddressTypeahead";

export interface PropertyDataResponse {
  propertyType?: string;
  estimatedValue?: number;
  landValue?: number;
  landValuePercentage?: number;
  yearBuilt?: number;
  squareFootage?: number;
  confidence: "high" | "medium" | "low";
  source: string;
  error?: string;
}

interface GooglePlaceDetails {
  types?: string[];
  price_level?: number;
  rating?: number;
  website?: string;
  formatted_phone_number?: string;
}

/**
 * Main function to fetch property data from multiple sources
 */
export async function fetchPropertyData(
  placeId: string,
  address: AddressComponents
): Promise<PropertyDataResponse> {
  try {
    // Try Google Places API first (most reliable)
    const googleData = await fetchFromGooglePlaces(placeId);
    if (googleData.propertyType) {
      return googleData;
    }

    // Fallback to smart defaults based on address patterns
    return generateSmartDefaults(address);

  } catch (error) {
    console.error("Error fetching property data:", error);

    // Always return smart defaults as final fallback
    return generateSmartDefaults(address);
  }
}

/**
 * Fetch property data from Google Places API
 */
async function fetchFromGooglePlaces(placeId: string): Promise<PropertyDataResponse> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    // Fetch place details from Google Places API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=types,price_level,rating,website,formatted_phone_number&key=${apiKey}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.result) {
      throw new Error(`Google Places API status: ${data.status}`);
    }

    return parseGooglePlaceDetails(data.result);

  } catch (error) {
    console.error("Google Places API fetch failed:", error);
    return {
      confidence: "low",
      source: "google_places_failed",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Parse Google Places details to extract property information
 */
function parseGooglePlaceDetails(placeDetails: GooglePlaceDetails): PropertyDataResponse {
  const types = placeDetails.types || [];

  // Map Google Places types to our property types
  let propertyType: string | undefined;
  let confidence: "high" | "medium" | "low" = "medium";

  // Check for specific property type indicators
  if (types.includes("real_estate_agency") || types.includes("premise")) {
    // This might not be a residential property
    confidence = "low";
  } else if (types.includes("establishment") && types.includes("point_of_interest")) {
    // Likely a commercial or mixed-use property
    propertyType = "apartment"; // Default to apartment for multi-unit
    confidence = "medium";
  } else if (types.includes("subpremise")) {
    // Indicates a unit within a larger building (condo/apartment)
    propertyType = "condo";
    confidence = "high";
  } else {
    // Default assumption for residential addresses
    propertyType = "single_family";
    confidence = "medium";
  }

  // Estimate property value based on area (very rough)
  let estimatedValue: number | undefined;
  let landValue: number | undefined;
  let landValuePercentage: number | undefined;

  if (propertyType === "single_family") {
    // Conservative estimate - user can adjust
    estimatedValue = 350000; // National median-ish
    landValuePercentage = 20;
    landValue = Math.round(estimatedValue * 0.20);
  } else if (propertyType === "condo") {
    estimatedValue = 280000;
    landValuePercentage = 15; // Lower for condos
    landValue = Math.round(estimatedValue * 0.15);
  }

  return {
    propertyType,
    estimatedValue,
    landValue,
    landValuePercentage,
    confidence,
    source: "google_places",
  };
}

/**
 * Generate smart defaults based on address patterns and location
 */
function generateSmartDefaults(address: AddressComponents): PropertyDataResponse {
  // Analyze address for patterns
  const street = address.street.toLowerCase();
  const city = address.city.toLowerCase();

  let propertyType = "single_family"; // Safe default
  let estimatedValue = 300000; // Conservative national average
  let landValuePercentage = 20;

  // Look for condo/apartment indicators in address
  if (
    street.includes("apt") ||
    street.includes("unit") ||
    street.includes("#") ||
    /\d+[a-z]$/i.test(address.street) // Ends with number+letter (e.g., "123A")
  ) {
    propertyType = "condo";
    landValuePercentage = 15;
  }

  // Look for townhouse indicators
  if (street.includes("townhouse") || street.includes("townhome")) {
    propertyType = "townhouse";
    landValuePercentage = 18;
  }

  // Adjust estimates based on known high-cost areas (rough heuristics)
  const highCostCities = [
    "san francisco", "palo alto", "mountain view", "cupertino",
    "new york", "manhattan", "brooklyn", "queens",
    "los angeles", "beverly hills", "santa monica",
    "seattle", "bellevue", "redmond",
    "boston", "cambridge", "somerville",
    "washington", "alexandria", "arlington"
  ];

  const isHighCostArea = highCostCities.some(hcCity =>
    city.includes(hcCity) || hcCity.includes(city)
  );

  if (isHighCostArea) {
    estimatedValue = propertyType === "single_family" ? 800000 : 600000;
  }

  const landValue = Math.round(estimatedValue * (landValuePercentage / 100));

  return {
    propertyType,
    estimatedValue,
    landValue,
    landValuePercentage,
    confidence: "medium",
    source: "smart_defaults",
  };
}

/**
 * Utility function to validate if a property type is valid
 */
export function isValidPropertyType(type: string): boolean {
  const validTypes = [
    "single_family",
    "condo",
    "townhouse",
    "multi_family",
    "apartment"
  ];
  return validTypes.includes(type);
}