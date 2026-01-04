"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export interface AddressComponents {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  placeId: string;
  formattedAddress: string;
}

export interface PropertyDataResult {
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

interface AddressTypeaheadProps {
  onAddressSelect: (address: AddressComponents, propertyData?: PropertyDataResult) => void;
  defaultValue?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  enablePropertyDataFetch?: boolean;
}

export default function AddressTypeahead({
  onAddressSelect,
  defaultValue = "",
  label = "Property Address",
  placeholder = "Start typing an address...",
  required = true,
  enablePropertyDataFetch = true,
}: AddressTypeaheadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null); // Will be PlaceAutocompleteElement
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPropertyData, setIsFetchingPropertyData] = useState(false);

  const parseAddressComponents = useCallback((components: google.maps.GeocoderAddressComponent[]): Omit<AddressComponents, 'placeId' | 'formattedAddress'> | null => {
    let streetNumber = "";
    let route = "";
    let city = "";
    let state = "";
    let zipCode = "";

    for (const component of components) {
      const types = component.types;

      if (types.includes("street_number")) {
        streetNumber = component.long_name;
      } else if (types.includes("route")) {
        route = component.long_name;
      } else if (types.includes("locality") || types.includes("sublocality_level_1")) {
        city = component.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        state = component.short_name; // Use short name for state (e.g., "TX")
      } else if (types.includes("postal_code")) {
        zipCode = component.long_name;
      }
    }

    // Construct street address
    const street = `${streetNumber} ${route}`.trim();

    // Validate required fields
    if (!street || !city || !state || !zipCode) {
      console.warn("Incomplete address components:", { street, city, state, zipCode });
      return null;
    }

    return {
      street,
      city,
      state,
      zipCode,
    };
  }, []);

  const fetchPropertyData = useCallback(async (address: AddressComponents): Promise<PropertyDataResult | undefined> => {
    if (!enablePropertyDataFetch) {
      return undefined;
    }

    try {
      setIsFetchingPropertyData(true);

      const response = await fetch('/api/properties/fetch-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeId: address.placeId,
          address,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      } else {
        console.warn('Property data fetch unsuccessful:', result);
        return undefined;
      }

    } catch (error) {
      console.error('Failed to fetch property data:', error);
      return undefined;
    } finally {
      setIsFetchingPropertyData(false);
    }
  }, [enablePropertyDataFetch]);

  const handlePlaceSelect = useCallback(async () => {
    if (!autocompleteRef.current) return;

    setIsLoading(true);
    const place = autocompleteRef.current.getPlace();

    if (!place.address_components || !place.formatted_address) {
      console.error("Invalid place selected");
      setIsLoading(false);
      return;
    }

    try {
      // Parse address components
      const addressComponents = parseAddressComponents(place.address_components);

      if (addressComponents) {
        const fullAddress: AddressComponents = {
          ...addressComponents,
          placeId: place.place_id || "",
          formattedAddress: place.formatted_address,
        };

        // Update input value
        setInputValue(place.formatted_address);

        // Fetch property data in background (don't block the UI)
        const propertyDataPromise = fetchPropertyData(fullAddress);

        // Notify parent component immediately with address
        onAddressSelect(fullAddress);

        // Then fetch property data and update when available
        try {
          const propertyData = await propertyDataPromise;
          if (propertyData) {
            // Notify parent again with property data
            onAddressSelect(fullAddress, propertyData);
          }
        } catch (error) {
          // Property data fetch failed, but address selection succeeded
          console.warn("Property data fetch failed:", error);
        }
      }
    } catch (error) {
      console.error("Error in place selection:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onAddressSelect, parseAddressComponents, fetchPropertyData]);

  // Handler for the new Places API
  const handlePlaceSelectNew = useCallback(async (place: any) => {
    setIsLoading(true);

    if (!place.addressComponents || !place.formattedAddress) {
      console.error("Invalid place selected from new API");
      setIsLoading(false);
      return;
    }

    try {
      // Convert new API address format to old format for compatibility
      const addressComponents = place.addressComponents.map((component: any) => ({
        long_name: component.longText,
        short_name: component.shortText,
        types: component.types
      }));

      const parsedComponents = parseAddressComponents(addressComponents);

      if (parsedComponents) {
        const fullAddress: AddressComponents = {
          ...parsedComponents,
          placeId: place.id || "",
          formattedAddress: place.formattedAddress,
        };

        // Update input value (we need to update the autocomplete element)
        if (autocompleteRef.current) {
          autocompleteRef.current.value = place.formattedAddress;
        }
        setInputValue(place.formattedAddress);

        // Fetch property data in background
        const propertyDataPromise = fetchPropertyData(fullAddress);

        // Notify parent component immediately with address
        onAddressSelect(fullAddress);

        // Then fetch property data and update when available
        try {
          const propertyData = await propertyDataPromise;
          if (propertyData) {
            onAddressSelect(fullAddress, propertyData);
          }
        } catch (error) {
          console.warn("Property data fetch failed:", error);
        }
      }
    } catch (error) {
      console.error("Error in new API place selection:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onAddressSelect, parseAddressComponents, fetchPropertyData]);

  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current) return;

    // Temporarily use old API until new API permissions are configured
    // The new Places API requires additional billing/permissions setup
    console.log("Using legacy Google Places API (with deprecation warnings)");
    initializeOldAutocomplete();

    // TODO: Re-enable new API once permissions are configured
    // try {
    //   // New Places API implementation would go here
    // } catch (error) {
    //   initializeOldAutocomplete();
    // }
  }, [handlePlaceSelect]);

  // Fallback to old API
  const initializeOldAutocomplete = useCallback(() => {
    if (!inputRef.current) return;

    // Initialize Google Places Autocomplete (old API)
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      fields: ["address_components", "formatted_address", "place_id"],
    });

    autocompleteRef.current = autocomplete;
    autocomplete.addListener("place_changed", handlePlaceSelect);
  }, [handlePlaceSelect]);

  useEffect(() => {
    // Only run on client side to avoid hydration issues
    if (typeof window === 'undefined' || !inputRef.current) return;

    const loadGoogleMapsAPI = async () => {
      // Check if Google Maps is already loaded
      if (typeof google !== "undefined" && google.maps && google.maps.places) {
        initializeAutocomplete();
        setIsLoaded(true);
        return;
      }

      // Load Google Maps API if not already loaded
      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        const script = document.createElement("script");
        // Standard Google Maps API loading
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;

        // Use Promise-based loading
        const loadPromise = new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });

        document.head.appendChild(script);

        try {
          await loadPromise;
          // Wait a bit for the API to fully initialize
          await new Promise(resolve => setTimeout(resolve, 100));

          if (typeof google !== "undefined" && google.maps && google.maps.places) {
            initializeAutocomplete();
            setIsLoaded(true);
          }
        } catch (error) {
          console.error("Failed to load Google Maps API:", error);
        }
      } else {
        // Script exists but might not be loaded yet
        const checkGoogleMaps = () => {
          if (typeof google !== "undefined" && google.maps && google.maps.places) {
            initializeAutocomplete();
            setIsLoaded(true);
          } else {
            setTimeout(checkGoogleMaps, 100);
          }
        };
        checkGoogleMaps();
      }
    };

    loadGoogleMapsAPI();
  }, [initializeAutocomplete]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="address-input">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="address-input"
          type="text"
          placeholder={isLoaded ? placeholder : "Loading Google Maps..."}
          value={inputValue}
          onChange={handleInputChange}
          disabled={!isLoaded}
          required={required}
          className={(isLoading || isFetchingPropertyData) ? "pr-10" : ""}
        />
        {(isLoading || isFetchingPropertyData) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      {!isLoaded && (
        <p className="text-sm text-gray-500">Loading address search...</p>
      )}
      {isFetchingPropertyData && (
        <p className="text-sm text-blue-600 animate-pulse">🏠 Fetching property details...</p>
      )}
    </div>
  );
}