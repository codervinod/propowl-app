"use client";

import { useState } from "react";
import { useTaxYear } from "@/contexts/TaxYearContext";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  ArrowLeft,
  MapPin,
  Building,
  Calendar,
  MoreVertical,
  Edit,
  Trash2
} from "lucide-react";
import TaxYearDataEntry from "@/components/tax-year/TaxYearDataEntry";
import PropertyEditDialog from "./PropertyEditDialog";
import PropertyDeleteDialog from "./PropertyDeleteDialog";
import PropertySwitcher from "./PropertySwitcher";
import { calculateImpliedLandValue } from "@/lib/schedule-e/calculations";

interface PropertyDetailClientProps {
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
    customDepreciation?: string | null;
  };
  user: {
    firstName?: string | null;
    emailAddress?: string;
  };
}

export default function PropertyDetailClient({ property, user }: PropertyDetailClientProps) {
  const { selectedTaxYear, setSelectedTaxYear, isLoading: taxYearLoading } = useTaxYear();
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i); // 3 years back, current, 3 years forward
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  const handleEditSuccess = () => {
    // Refresh the page to show updated data
    window.location.reload();
  };

  const handleDeleteSuccess = () => {
    // Redirect to dashboard after successful deletion
    window.location.href = "/dashboard";
  };

  // Show loading state while tax year context is initializing
  if (taxYearLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <span className="text-6xl">🦉</span>
          </div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative overflow-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center min-h-[60px] relative">
            <div className="flex items-center gap-4 lg:gap-6 min-w-0 flex-1 overflow-visible">
              <Link href="/dashboard" className="flex-shrink-0">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 hover:text-orange-500">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to Properties</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-3xl lg:text-4xl">🦉</span>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-orange-500">PropOwl</h1>
                  <p className="text-xs lg:text-sm text-gray-600">Property Tax Management</p>
                </div>
              </div>
              {/* Property Switcher */}
              <div className="hidden lg:block min-w-0 flex-1 relative z-20 max-w-[400px]">
                <PropertySwitcher
                  currentPropertyId={property.id}
                  currentProperty={{
                    id: property.id,
                    street: property.street,
                    streetLine2: property.streetLine2,
                    city: property.city,
                    state: property.state,
                    zipCode: property.zipCode,
                    propertyType: property.propertyType,
                  }}
                />
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

      {/* Mobile Property Switcher */}
      <div className="sm:hidden bg-white border-b border-gray-200 shadow-sm relative overflow-visible">
        <div className="max-w-7xl mx-auto px-4 py-3 relative z-20">
          <PropertySwitcher
            currentPropertyId={property.id}
            currentProperty={{
              id: property.id,
              street: property.street,
              streetLine2: property.streetLine2,
              city: property.city,
              state: property.state,
              zipCode: property.zipCode,
              propertyType: property.propertyType,
            }}
          />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Property Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Building className="h-6 w-6 text-orange-500" />
              <h2 className="text-3xl font-bold text-gray-800">
                {getPropertyTypeLabel(property.propertyType)}
              </h2>
            </div>

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Property
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Property
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2 text-lg text-gray-600 mb-4">
            <MapPin className="h-5 w-5" />
            {property.street}{property.streetLine2 ? `, ${property.streetLine2}` : ''}, {property.city}, {property.state} {property.zipCode}
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
                    <p className="text-sm text-gray-600">
                      Land Value {property.customDepreciation && "(CPA Implied)"}
                    </p>
                    <p className="text-xl font-bold text-gray-800">
                      {formatCurrency(
                        property.customDepreciation
                          ? calculateImpliedLandValue(
                              parseFloat(property.purchasePrice),
                              parseFloat(property.customDepreciation)
                            )
                          : parseFloat(property.landValue)
                      )}
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
                        property.customDepreciation
                          ? parseFloat(property.customDepreciation)
                          : Math.round((parseFloat(property.purchasePrice) - parseFloat(property.landValue)) / 27.5)
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

      {/* Edit Dialog */}
      <PropertyEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        property={property}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Dialog */}
      <PropertyDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        property={property}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}