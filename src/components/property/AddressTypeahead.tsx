"use client";

import { useEffect, useRef, useState } from "react";
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

interface AddressTypeaheadProps {
  onAddressSelect: (address: AddressComponents) => void;
  defaultValue?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export default function AddressTypeahead({
  onAddressSelect,
  defaultValue = "",
  label = "Property Address",
  placeholder = "Start typing an address...",
  required = true,
}: AddressTypeaheadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (typeof google !== "undefined" && google.maps && google.maps.places) {
      initializeAutocomplete();
      setIsLoaded(true);
      return;
    }

    // Load Google Maps API if not already loaded
    if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeAutocomplete();
        setIsLoaded(true);
      };
      script.onerror = () => {
        console.error("Failed to load Google Maps API");
      };
      document.head.appendChild(script);
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
  }, []);

  const initializeAutocomplete = () => {
    if (!inputRef.current) return;

    // Initialize Google Places Autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" }, // Restrict to US addresses
      fields: ["address_components", "formatted_address", "place_id"],
    });

    // Listen for place selection
    autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
  };

  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;

    setIsLoading(true);
    const place = autocompleteRef.current.getPlace();

    if (!place.address_components || !place.formatted_address) {
      console.error("Invalid place selected");
      setIsLoading(false);
      return;
    }

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

      // Notify parent component
      onAddressSelect(fullAddress);
    }

    setIsLoading(false);
  };

  const parseAddressComponents = (components: google.maps.GeocoderAddressComponent[]): Omit<AddressComponents, 'placeId' | 'formattedAddress'> | null => {
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
  };

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
          className={isLoading ? "pr-10" : ""}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      {!isLoaded && (
        <p className="text-sm text-gray-500">Loading address search...</p>
      )}
    </div>
  );
}