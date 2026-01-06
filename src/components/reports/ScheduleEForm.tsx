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

  const handlePrint = () => {
    // Create a new window for printing with properly formatted content
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = generatePrintHTML();

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const generatePrintHTML = () => {
    const address = `${currentProperty.property.address.street}${currentProperty.property.address.streetLine2 ? `, ${currentProperty.property.address.streetLine2}` : ''}, ${currentProperty.property.address.city}, ${currentProperty.property.address.state} ${currentProperty.property.address.zipCode}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Schedule E (Form 1040) - Tax Year ${currentProperty.taxYear}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      line-height: 1.4;
      color: #000;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
    }
    .property-info {
      background-color: #f9f9f9;
      border: 2px solid #000;
      padding: 15px;
      margin-bottom: 20px;
    }
    .property-info h3 {
      margin-top: 0;
      margin-bottom: 10px;
    }
    .schedule-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .schedule-table th,
    .schedule-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    .schedule-table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    .line-number {
      width: 8%;
      text-align: center;
      font-weight: bold;
    }
    .description {
      width: 70%;
    }
    .amount {
      width: 22%;
      text-align: right;
      font-family: monospace;
    }
    .income-row {
      background-color: #f0f9ff;
    }
    .depreciation-row {
      background-color: #eff6ff;
    }
    .total-row {
      background-color: #fef2f2;
      font-weight: bold;
    }
    .net-income-row {
      background-color: ${currentProperty.totals.netIncome >= 0 ? '#f0f9ff' : '#f9fafb'};
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 11px;
      color: #666;
      border-top: 1px solid #ccc;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>SCHEDULE E<br>(Form 1040)</h1>
    <h2>Supplemental Income and Loss from Rental Real Estate Activities</h2>
    <h3>Tax Year ${currentProperty.taxYear}</h3>
  </div>

  <div class="property-info">
    <h3>Property Information</h3>
    <p><strong>Property A Address:</strong><br>${address}</p>
    <p><strong>Property Type:</strong> ${currentProperty.property.propertyType}</p>
    <p><strong>Purchase Date:</strong> ${new Date(currentProperty.property.purchaseDate).toLocaleDateString()}</p>
    <p><strong>Purchase Price:</strong> ${formatCurrency(currentProperty.property.purchasePrice)}</p>
  </div>

  <table class="schedule-table">
    <thead>
      <tr>
        <th class="line-number">Line</th>
        <th class="description">Description</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      <!-- Income -->
      <tr class="income-row">
        <td class="line-number">3</td>
        <td class="description">Rents received</td>
        <td class="amount">${formatTaxAmount(currentProperty.income.rentalIncome)}</td>
      </tr>

      <!-- Expenses -->
      <tr>
        <td class="line-number">5</td>
        <td class="description">Advertising</td>
        <td class="amount">${formatTaxAmount(currentProperty.expenses.advertising)}</td>
      </tr>
      <tr>
        <td class="line-number">6</td>
        <td class="description">Auto and travel</td>
        <td class="amount">${formatTaxAmount(currentProperty.expenses.autoAndTravel)}</td>
      </tr>
      <tr>
        <td class="line-number">7</td>
        <td class="description">Cleaning and maintenance</td>
        <td class="amount">${formatTaxAmount(currentProperty.expenses.cleaningAndMaintenance)}</td>
      </tr>
      <tr>
        <td class="line-number">8</td>
        <td class="description">Commissions</td>
        <td class="amount">${formatTaxAmount(currentProperty.expenses.commissions)}</td>
      </tr>
      <tr>
        <td class="line-number">9</td>
        <td class="description">Insurance</td>
        <td class="amount">${formatTaxAmount(currentProperty.expenses.insurance)}</td>
      </tr>
      <tr>
        <td class="line-number">10</td>
        <td class="description">Legal and other professional fees</td>
        <td class="amount">${formatTaxAmount(currentProperty.expenses.legal)}</td>
      </tr>
      <tr>
        <td class="line-number">11</td>
        <td class="description">Management fees</td>
        <td class="amount">${formatTaxAmount(currentProperty.expenses.managementFees)}</td>
      </tr>
      <tr>
        <td class="line-number">12</td>
        <td class="description">Mortgage interest paid to banks, etc.</td>
        <td class="amount">${formatTaxAmount(currentProperty.expenses.mortgageInterest)}</td>
      </tr>
      <tr>
        <td class="line-number">13</td>
        <td class="description">Other interest</td>
        <td class="amount">${formatTaxAmount(currentProperty.expenses.otherInterest)}</td>
      </tr>
      <tr>
        <td class="line-number">14</td>
        <td class="description">Repairs</td>
        <td class="amount">${formatTaxAmount(currentProperty.expenses.repairs)}</td>
      </tr>
      <tr>
        <td class="line-number">15</td>
        <td class="description">Supplies</td>
        <td class="amount">${formatTaxAmount(currentProperty.expenses.supplies)}</td>
      </tr>
      <tr>
        <td class="line-number">16</td>
        <td class="description">Taxes</td>
        <td class="amount">${formatTaxAmount(currentProperty.expenses.taxes)}</td>
      </tr>
      <tr>
        <td class="line-number">17</td>
        <td class="description">Utilities</td>
        <td class="amount">${formatTaxAmount(currentProperty.expenses.utilities)}</td>
      </tr>
      <tr class="depreciation-row">
        <td class="line-number">18</td>
        <td class="description">Depreciation expense</td>
        <td class="amount">${formatTaxAmount(currentProperty.expenses.depreciation)}</td>
      </tr>
      <tr>
        <td class="line-number">19</td>
        <td class="description">Other</td>
        <td class="amount">${formatTaxAmount(currentProperty.expenses.other)}</td>
      </tr>

      <!-- Totals -->
      <tr class="total-row">
        <td class="line-number">20</td>
        <td class="description">Total expenses</td>
        <td class="amount">${formatTaxAmount(currentProperty.totals.totalExpenses)}</td>
      </tr>
      <tr class="net-income-row">
        <td class="line-number">21</td>
        <td class="description">Income or (loss) from rental real estate activities</td>
        <td class="amount">${currentProperty.totals.netIncome < 0
          ? `(${formatTaxAmount(Math.abs(currentProperty.totals.netIncome))})`
          : formatTaxAmount(currentProperty.totals.netIncome)
        }</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p><strong>Important:</strong> This Schedule E data is for informational purposes only. Please consult with a qualified tax professional before filing your tax return. Verify all amounts against your source documents.</p>
    <p>Generated by PropOwl - The wise way to manage rentals</p>
  </div>
</body>
</html>
    `;
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