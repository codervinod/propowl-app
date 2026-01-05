"use client";

import { useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home,
  ArrowLeft,
  MapPin,
  Building,
  Calendar
} from "lucide-react";
import TaxYearDataEntry from "@/components/tax-year/TaxYearDataEntry";

interface PropertyDetailClientProps {
  property: {
    id: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    propertyType: string;
    purchasePrice: string;
    landValue: string;
  };
  user: {
    firstName?: string | null;
    emailAddress?: string;
  };
}

export default function PropertyDetailClient({ property, user }: PropertyDetailClientProps) {
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i); // 3 years back, current, 3 years forward
  const [selectedTaxYear, setSelectedTaxYear] = useState(currentYear);

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getPropertyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      single_family: "Single Family Home",
      condo: "Condominium",
      townhouse: "Townhouse",
      multi_family: "Multi-Family (2-4 units)",
      apartment: "Apartment Building (5+ units)",
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 hover:text-orange-500">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Properties
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-4xl">🦉</span>
                <div>
                  <h1 className="text-2xl font-bold text-orange-500">PropOwl</h1>
                  <p className="text-sm text-gray-600">Property Tax Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700 font-medium">
                {user.firstName || user.emailAddress}
              </span>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Property Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building className="h-6 w-6 text-orange-500" />
            <h2 className="text-3xl font-bold text-gray-800">
              {getPropertyTypeLabel(property.propertyType)}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-lg text-gray-600 mb-4">
            <MapPin className="h-5 w-5" />
            {property.street}, {property.city}, {property.state} {property.zipCode}
          </div>

          {/* Property Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Purchase Price</p>
                    <p className="text-xl font-bold text-gray-800">
                      {formatCurrency(property.purchasePrice)}
                    </p>
                  </div>
                  <Home className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Land Value</p>
                    <p className="text-xl font-bold text-gray-800">
                      {formatCurrency(property.landValue)}
                    </p>
                  </div>
                  <Building className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Annual Depreciation</p>
                    <p className="text-xl font-bold text-gray-800">
                      {formatCurrency(
                        Math.round((parseFloat(property.purchasePrice) - parseFloat(property.landValue)) / 27.5)
                      )}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tax Year Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-semibold text-gray-800">Tax Year</h3>
            <Select value={selectedTaxYear.toString()} onValueChange={(value) => setSelectedTaxYear(parseInt(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select tax year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year} {year === currentYear && "(Current)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-gray-600 mt-1">
            Enter your rental income and expenses for tax year {selectedTaxYear}
          </p>
        </div>

        {/* Tax Year Data Entry Component */}
        <TaxYearDataEntry propertyId={property.id} taxYear={selectedTaxYear} />
      </main>
    </div>
  );
}