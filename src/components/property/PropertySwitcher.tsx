"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building, MapPin } from "lucide-react";

interface Property {
  id: string;
  street: string;
  streetLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
}

interface PropertySwitcherProps {
  currentPropertyId: string;
  currentProperty: Property;
}

export default function PropertySwitcher({ currentPropertyId, currentProperty }: PropertySwitcherProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch("/api/properties");
        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties || []);
        }
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      }
    };

    fetchProperties();
  }, []);

  const handlePropertyChange = (propertyId: string) => {
    if (propertyId !== currentPropertyId) {
      setIsLoading(true);
      router.push(`/properties/${propertyId}`);
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      single_family: "Single Family",
      condo: "Condo",
      townhouse: "Townhouse",
      multi_family: "Multi-Family",
      apartment: "Apartment",
    };
    return types[type] || type;
  };

  const formatPropertyDisplay = (property: Property) => {
    const address = [property.street, property.city, property.state]
      .filter(Boolean)
      .join(", ");
    return address;
  };

  const formatPropertySubtext = (property: Property) => {
    return getPropertyTypeLabel(property.propertyType);
  };

  // If only one property, don't show the switcher
  if (properties.length <= 1) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
        <Building className="h-5 w-5 text-orange-600" />
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {formatPropertyDisplay(currentProperty)}
          </div>
          <div className="text-xs text-gray-500">
            {formatPropertySubtext(currentProperty)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building className="h-5 w-5 text-orange-600 flex-shrink-0" />
      <Select
        value={currentPropertyId}
        onValueChange={handlePropertyChange}
        disabled={isLoading}
      >
        <SelectTrigger className="min-w-[280px] h-auto py-2 px-3 bg-orange-50 border-orange-200 hover:bg-orange-100 transition-colors">
          <SelectValue asChild>
            <div className="flex flex-col items-start text-left">
              <div className="text-sm font-medium text-gray-900 truncate max-w-[240px]">
                {formatPropertyDisplay(currentProperty)}
              </div>
              <div className="text-xs text-gray-500">
                {formatPropertySubtext(currentProperty)}
              </div>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-w-[400px]">
          {properties.map((property) => (
            <SelectItem key={property.id} value={property.id} className="py-3">
              <div className="flex items-start gap-3 w-full">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {formatPropertyDisplay(property)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatPropertySubtext(property)}
                  </div>
                </div>
                {property.id === currentPropertyId && (
                  <div className="text-xs text-orange-600 font-medium">Current</div>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}