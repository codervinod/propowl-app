"use client";

import PropertyDetailClient from "./PropertyDetailClient";
import { TaxYearProvider } from "@/contexts/TaxYearContext";

interface PropertyPageClientProps {
  property: {
    id: string;
    street: string;
    streetLine2?: string | null;
    city: string;
    state: string;
    zipCode: string;
    propertyType: string;
    purchaseDate: string;
    purchasePrice: string;
    landValue: string;
  };
  user: {
    firstName?: string | null;
    emailAddress?: string;
  };
}

export default function PropertyPageClient({ property, user }: PropertyPageClientProps) {
  return (
    <TaxYearProvider>
      <PropertyDetailClient property={property} user={user} />
    </TaxYearProvider>
  );
}