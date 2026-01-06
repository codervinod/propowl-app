"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Printer,
  AlertCircle,
  Calculator,
  Building2,
  X,
} from "lucide-react";
import {
  ScheduleEData,
  ScheduleESummary,
} from "@/lib/schedule-e/types";
import {
  formatCurrency,
  formatTaxAmount,
  validateScheduleEData,
} from "@/lib/schedule-e/calculations";
import { ScheduleETable } from "./ScheduleETable";

interface ScheduleEFormProps {
  data: ScheduleEData | ScheduleESummary;
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string; // For single property exports
  taxYear: number;
}

export default function ScheduleEForm({
  data,
  isOpen,
  onClose,
  propertyId,
  taxYear,
}: ScheduleEFormProps) {
  const [activeProperty, setActiveProperty] = useState(0);

  // Determine if this is multi-property data
  const isMultiProperty = "properties" in data;
  const properties = isMultiProperty ? data.properties : [data];
  const currentProperty = properties[activeProperty];

  // Validate current property data
  const validationErrors = validateScheduleEData(currentProperty);

  // Export functions
  const handleExportPDF = () => {
    let pdfUrl = `/api/reports/pdf?taxYear=${taxYear}`;

    if (isMultiProperty) {
      pdfUrl += "&includeAllProperties=true";
    } else if (propertyId) {
      pdfUrl += `&propertyId=${propertyId}`;
    }

    window.open(pdfUrl, '_blank');
  };

  const handleExportCSV = (format: 'csv' | 'turbotax' | 'quickbooks' = 'csv') => {
    let csvUrl = `/api/reports/csv?taxYear=${taxYear}&format=${format}`;

    if (isMultiProperty) {
      csvUrl += "&includeAllProperties=true";
    } else if (propertyId) {
      csvUrl += `&propertyId=${propertyId}`;
    }

    window.open(csvUrl, '_blank');
  };

  const handlePrint = async () => {
    try {
      // Get the HTML content that's used to generate the PDF
      let apiUrl = `/api/reports/pdf?taxYear=${taxYear}&format=html`;

      if (isMultiProperty) {
        apiUrl += "&includeAllProperties=true";
      } else if (propertyId) {
        apiUrl += `&propertyId=${propertyId}`;
      }

      // Fetch the HTML content from the PDF API
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch print content');
      }

      const htmlContent = await response.text();

      // Create a new window for printing with the HTML content
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        // Fallback if popup is blocked
        window.print();
        return;
      }

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);

    } catch (error) {
      console.error('Print error:', error);
      // Fallback to regular print
      window.print();
    }
  };



  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] w-full overflow-y-auto print-content">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold">
                <FileText className="h-6 w-6 text-orange-500" />
                Schedule E (Form 1040) - Tax Year {currentProperty.taxYear}
              </h1>
              <p className="text-gray-600 mt-1">
                Supplemental Income and Loss from Rental Real Estate Activities
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onClose} className="print-hide">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">

        <div className="space-y-6">
          {/* Multi-property selector */}
          {isMultiProperty && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Property Selection ({properties.length} properties)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {properties.map((prop, index) => (
                    <Button
                      key={prop.property.id}
                      variant={activeProperty === index ? "default" : "outline"}
                      onClick={() => setActiveProperty(index)}
                      className="text-sm"
                    >
                      Property {String.fromCharCode(65 + index)}: {prop.property.address.street}{prop.property.address.streetLine2 ? `, ${prop.property.address.streetLine2}` : ''}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Warnings */}
          {validationErrors.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Data Validation Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-yellow-700 text-sm">• {error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Address:</strong><br />
                  {currentProperty.property.address.street}{currentProperty.property.address.streetLine2 ? `, ${currentProperty.property.address.streetLine2}` : ''}<br />
                  {currentProperty.property.address.city}, {currentProperty.property.address.state} {currentProperty.property.address.zipCode}
                </div>
                <div>
                  <strong>Property Type:</strong> {currentProperty.property.propertyType}<br />
                  <strong>Purchase Date:</strong> {new Date(currentProperty.property.purchaseDate).toLocaleDateString()}<br />
                  <strong>Purchase Price:</strong> {formatCurrency(currentProperty.property.purchasePrice)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule E Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-green-500" />
                Schedule E - Lines 3-21
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScheduleETable data={currentProperty} />
            </CardContent>
          </Card>

          {/* Multi-property Summary */}
          {isMultiProperty && (
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Summary - Tax Year {data.taxYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead className="text-right">Income</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Depreciation</TableHead>
                      <TableHead className="text-right">Net Income</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((prop) => (
                      <TableRow key={prop.property.id}>
                        <TableCell className="font-medium">
                          {prop.property.address.street}{prop.property.address.streetLine2 ? `, ${prop.property.address.streetLine2}` : ''}, {prop.property.address.city}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatTaxAmount(prop.income.rentalIncome)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatTaxAmount(prop.totals.totalExpenses - prop.expenses.depreciation)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatTaxAmount(prop.expenses.depreciation)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {prop.totals.netIncome < 0
                            ? `(${formatTaxAmount(Math.abs(prop.totals.netIncome))})`
                            : formatTaxAmount(prop.totals.netIncome)
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 bg-blue-50 font-bold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">
                        {formatTaxAmount(data.totals.totalIncome)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatTaxAmount(data.totals.totalExpenses - data.totals.totalDepreciation)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatTaxAmount(data.totals.totalDepreciation)}
                      </TableCell>
                      <TableCell className="text-right">
                        {data.totals.netIncome < 0
                          ? `(${formatTaxAmount(Math.abs(data.totals.netIncome))})`
                          : formatTaxAmount(data.totals.netIncome)
                        }
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Export Actions */}
          <Card className="print-hide">
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleExportPDF} className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Export Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Export CSV:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCSV('csv')}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Standard CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCSV('turbotax')}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      TurboTax Format
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCSV('quickbooks')}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      QuickBooks Format
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> This Schedule E data is for informational purposes only.
                  Please consult with a qualified tax professional before filing your tax return.
                  Verify all amounts against your source documents.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        </div>
      </div>
    </div>
  );
}