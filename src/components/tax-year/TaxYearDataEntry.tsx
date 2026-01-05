"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DollarSign,
  Plus,
  Trash2,
  FileText,
  Save,
  Loader2,
  TrendingUp,
  CreditCard,
  Download,
  Calculator
} from "lucide-react";
import ScheduleEForm from "@/components/reports/ScheduleEForm";
import { ScheduleEData } from "@/lib/schedule-e/types";

interface TaxYearDataEntryProps {
  propertyId: string;
  taxYear: number;
}

interface IncomeEntry {
  id: string;
  type: 'rental' | 'other';
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'annual';
  description: string;
  startDate?: string;
  endDate?: string;
}

interface ExpenseEntry {
  id: string;
  category: string;
  amount: number;
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'annual';
  description: string;
  vendor?: string;
  date: string;
  isMandatory?: boolean;
}

// Common mandatory expense categories (shown first with quick add sections)
const MANDATORY_EXPENSE_TYPES = [
  {
    category: "mortgage_interest",
    label: "Mortgage Interest",
    scheduleE: "Line 12",
    description: "Interest from mortgages, HELOCs, etc.",
    examples: "Primary mortgage, second mortgage, HELOC interest",
    icon: "🏠"
  },
  {
    category: "property_taxes",
    label: "Property Taxes",
    scheduleE: "Line 16",
    description: "Property tax assessments",
    examples: "County taxes, city taxes, special assessments",
    icon: "🏛️"
  },
  {
    category: "insurance",
    label: "Insurance",
    scheduleE: "Line 9",
    description: "Property insurance premiums",
    examples: "Homeowners, landlord, umbrella insurance",
    icon: "🛡️"
  },
];

// All other expense categories
const OTHER_EXPENSE_CATEGORIES = [
  { value: "advertising", label: "Advertising", scheduleE: "Line 5" },
  { value: "auto_travel", label: "Auto & Travel", scheduleE: "Line 6" },
  { value: "cleaning_maintenance", label: "Cleaning & Maintenance", scheduleE: "Line 7" },
  { value: "commissions", label: "Commissions", scheduleE: "Line 8" },
  { value: "legal_professional", label: "Legal & Professional", scheduleE: "Line 10" },
  { value: "management_fees", label: "Management Fees", scheduleE: "Line 11" },
  { value: "other_interest", label: "Other Interest", scheduleE: "Line 13" },
  { value: "repairs", label: "Repairs", scheduleE: "Line 14" },
  { value: "supplies", label: "Supplies", scheduleE: "Line 15" },
  { value: "utilities", label: "Utilities", scheduleE: "Line 17" },
  { value: "other", label: "Other", scheduleE: "Line 19" },
];


// For optional expenses dropdown - exclude mandatory categories
const OPTIONAL_EXPENSE_CATEGORIES = OTHER_EXPENSE_CATEGORIES;

export default function TaxYearDataEntry({ propertyId, taxYear }: TaxYearDataEntryProps) {
  // State for income entries
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [newIncome, setNewIncome] = useState({
    type: 'rental' as 'rental' | 'other',
    amount: 0,
    frequency: 'monthly' as 'monthly' | 'quarterly' | 'annual',
    description: '',
  });

  // State for all expense entries
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [newExpense, setNewExpense] = useState({
    category: "",
    amount: 0,
    frequency: 'one-time' as 'one-time' | 'monthly' | 'quarterly' | 'annual',
    description: "",
    vendor: "",
    date: new Date().toISOString().split('T')[0],
  });

  // State for new mandatory expense forms (one per category)
  const [newMandatoryExpenses, setNewMandatoryExpenses] = useState<{[key: string]: {
    amount: number;
    frequency: 'one-time' | 'monthly' | 'quarterly' | 'annual';
    description: string;
    vendor: string;
    date: string;
  }}>({
    mortgage_interest: {
      amount: 0,
      frequency: 'annual',
      description: '',
      vendor: '',
      date: new Date().toISOString().split('T')[0],
    },
    property_taxes: {
      amount: 0,
      frequency: 'annual',
      description: '',
      vendor: '',
      date: new Date().toISOString().split('T')[0],
    },
    insurance: {
      amount: 0,
      frequency: 'annual',
      description: '',
      vendor: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Loading and tab state
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("income");

  // Schedule E state
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [scheduleEError, setScheduleEError] = useState<string | null>(null);
  const [showScheduleEModal, setShowScheduleEModal] = useState(false);
  const [scheduleEData, setScheduleEData] = useState<ScheduleEData | null>(null);

  // Load existing data
  useEffect(() => {
    const loadTaxYearData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/tax-year?propertyId=${propertyId}&taxYear=${taxYear}`);

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Convert frequency from database enum to frontend format
            const convertFrequencyFromDB = (freq: string) => {
              switch (freq) {
                case 'one_time': return 'one-time';
                case 'monthly': return 'monthly';
                case 'quarterly': return 'quarterly';
                case 'annual': return 'annual';
                default: return 'one-time';
              }
            };

            // Load income data - use new structured data if available
            if (result.data.incomes && result.data.incomes.length > 0) {
              const loadedIncomes: IncomeEntry[] = result.data.incomes.map((income: {
                id: string;
                type: 'rental' | 'other';
                amount: number;
                frequency: string;
                description: string;
              }) => ({
                id: income.id,
                type: income.type,
                amount: income.amount,
                frequency: convertFrequencyFromDB(income.frequency),
                description: income.description || "",
              }));
              setIncomeEntries(loadedIncomes);
            } else if (result.data.grossRent > 0) {
              // Backward compatibility: convert old gross rent to income entry
              setIncomeEntries([{
                id: 'rental-income',
                type: 'rental',
                amount: result.data.grossRent,
                frequency: 'annual',
                description: 'Gross Rental Income',
              }]);
            }

            // Load expense data with preserved frequency
            const expenses = result.data.expenses || [];
            const allExpenses: ExpenseEntry[] = expenses.map((expense: {
              id: string;
              category: string;
              amount: number;
              frequency: string;
              description: string;
              vendor: string;
              date: string;
            }) => ({
              id: expense.id,
              category: expense.category,
              amount: expense.amount,
              frequency: convertFrequencyFromDB(expense.frequency),
              description: expense.description || "",
              vendor: expense.vendor || "",
              date: expense.date,
            }));

            setExpenseEntries(allExpenses);
          }
        }
      } catch (error) {
        console.error("Error loading tax year data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTaxYearData();
  }, [propertyId, taxYear]);

  // Helper functions
  const annualizeAmount = (amount: number, frequency: string) => {
    switch (frequency) {
      case 'monthly': return amount * 12;
      case 'quarterly': return amount * 4;
      case 'annual': return amount;
      default: return amount;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Income functions
  const handleAddIncome = async () => {
    if (newIncome.amount > 0) {
      const income: IncomeEntry = {
        id: Math.random().toString(36).substr(2, 9),
        type: newIncome.type,
        amount: newIncome.amount,
        frequency: newIncome.frequency,
        description: newIncome.description || (newIncome.type === 'rental' ? 'Rental Income' : 'Other Income'),
      };

      const updatedIncomeEntries = [...incomeEntries, income];
      setIncomeEntries(updatedIncomeEntries);

      // Auto-save to database
      await autoSaveData(updatedIncomeEntries, expenseEntries);

      setNewIncome({
        type: 'rental',
        amount: 0,
        frequency: 'monthly',
        description: '',
      });
    }
  };

  const handleRemoveIncome = async (id: string) => {
    const updatedIncomeEntries = incomeEntries.filter(income => income.id !== id);
    setIncomeEntries(updatedIncomeEntries);

    // Auto-save to database
    await autoSaveData(updatedIncomeEntries, expenseEntries);
  };

  // Expense functions
  const handleAddExpense = async () => {
    if (newExpense.category && newExpense.amount > 0) {
      const expense: ExpenseEntry = {
        id: Math.random().toString(36).substr(2, 9),
        category: newExpense.category,
        amount: newExpense.amount,
        frequency: newExpense.frequency,
        description: newExpense.description,
        vendor: newExpense.vendor,
        date: newExpense.date,
      };

      const updatedExpenseEntries = [...expenseEntries, expense];
      setExpenseEntries(updatedExpenseEntries);

      // Auto-save to database
      await autoSaveData(incomeEntries, updatedExpenseEntries);

      setNewExpense({
        category: "",
        amount: 0,
        frequency: 'one-time',
        description: "",
        vendor: "",
        date: new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleRemoveExpense = async (id: string) => {
    const updatedExpenseEntries = expenseEntries.filter(expense => expense.id !== id);
    setExpenseEntries(updatedExpenseEntries);

    // Auto-save to database
    await autoSaveData(incomeEntries, updatedExpenseEntries);
  };

  // Mandatory expense functions
  const handleAddMandatoryExpense = async (category: string) => {
    const formData = newMandatoryExpenses[category];
    if (formData && formData.amount > 0) {
      const expense: ExpenseEntry = {
        id: Math.random().toString(36).substr(2, 9),
        category,
        amount: formData.amount,
        frequency: formData.frequency,
        description: formData.description || MANDATORY_EXPENSE_TYPES.find(t => t.category === category)?.label || '',
        vendor: formData.vendor,
        date: formData.date,
        isMandatory: true,
      };

      const updatedExpenseEntries = [...expenseEntries, expense];
      setExpenseEntries(updatedExpenseEntries);

      // Auto-save to database
      await autoSaveData(incomeEntries, updatedExpenseEntries);

      // Reset the form for this category
      setNewMandatoryExpenses(prev => ({
        ...prev,
        [category]: {
          amount: 0,
          frequency: 'annual',
          description: '',
          vendor: '',
          date: new Date().toISOString().split('T')[0],
        }
      }));
    }
  };

  const handleUpdateMandatoryExpenseForm = (category: string, field: string, value: string | number) => {
    setNewMandatoryExpenses(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      }
    }));
  };

  // Calculate totals
  const totalIncome = incomeEntries.reduce((sum, income) => sum + annualizeAmount(income.amount, income.frequency), 0);

  // Calculate mandatory expenses from expense entries
  const mandatoryExpenseEntries = expenseEntries.filter(expense =>
    MANDATORY_EXPENSE_TYPES.some(type => type.category === expense.category)
  );
  const totalMandatoryExpenses = mandatoryExpenseEntries.reduce((sum, expense) =>
    sum + annualizeAmount(expense.amount, expense.frequency), 0
  );

  // Calculate optional expenses (exclude mandatory categories)
  const optionalExpenseEntries = expenseEntries.filter(expense =>
    !MANDATORY_EXPENSE_TYPES.some(type => type.category === expense.category)
  );
  const totalOptionalExpenses = optionalExpenseEntries.reduce((sum, expense) =>
    sum + annualizeAmount(expense.amount, expense.frequency), 0
  );

  const totalExpenses = totalMandatoryExpenses + totalOptionalExpenses;
  const netIncome = totalIncome - totalExpenses;

  // Auto-save function - FIXED to preserve frequency
  const autoSaveData = async (incomes: IncomeEntry[], expenses: ExpenseEntry[]) => {
    try {
      // Convert frequency strings to match database enum
      const convertFrequency = (freq: string) => {
        switch (freq) {
          case 'one-time': return 'one_time';
          case 'monthly': return 'monthly';
          case 'quarterly': return 'quarterly';
          case 'annual': return 'annual';
          default: return 'one_time';
        }
      };

      // Send data with original amounts and frequencies preserved
      const incomesForAPI = incomes.map(income => ({
        type: income.type,
        amount: income.amount, // Keep original amount, don't annualize!
        frequency: convertFrequency(income.frequency),
        description: income.description,
      }));

      const expensesForAPI = expenses.map(expense => ({
        category: expense.category,
        amount: expense.amount, // Keep original amount, don't annualize!
        frequency: convertFrequency(expense.frequency),
        description: expense.description,
        vendor: expense.vendor,
        date: expense.date,
      }));

      // Calculate totals for backward compatibility
      const totalIncomeForSave = incomes.reduce((sum, income) => sum + annualizeAmount(income.amount, income.frequency), 0);

      const response = await fetch("/api/tax-year", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId,
          taxYear,
          incomes: incomesForAPI,
          expenses: expensesForAPI,
          // Backward compatibility
          grossRent: totalIncomeForSave,
          otherIncome: 0,
        }),
      });

      if (!response.ok) {
        console.error("Auto-save failed:", await response.text());
      }
    } catch (error) {
      console.error("Error auto-saving data:", error);
    }
  };

  // Schedule E handlers
  const handleGenerateScheduleE = async () => {
    try {
      setIsGeneratingReport(true);
      setScheduleEError(null);

      const response = await fetch(`/api/schedule-e?propertyId=${propertyId}&taxYear=${taxYear}`);

      if (!response.ok) {
        throw new Error(`Failed to generate Schedule E: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Set the data and show the modal
        setScheduleEData(result.data);
        setShowScheduleEModal(true);
        console.log('Schedule E Data:', result.data);
      } else {
        throw new Error(result.error || 'Failed to generate Schedule E');
      }
    } catch (error) {
      console.error('Error generating Schedule E:', error);
      setScheduleEError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleExportData = () => {
    // Export CSV for the current property
    const csvUrl = `/api/reports/csv?propertyId=${propertyId}&taxYear=${taxYear}`;
    window.open(csvUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-3 text-lg text-gray-600">Loading tax year data...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="income" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Income
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Report
          </TabsTrigger>
        </TabsList>

        {/* Income Tab */}
        <TabsContent value="income" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Rental Income
              </CardTitle>
              <CardDescription>
                Enter your rental income for {taxYear}. You can add income by different frequencies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Income Form */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-4">Add Income Entry</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="income-type">Type</Label>
                    <Select value={newIncome.type} onValueChange={(value: 'rental' | 'other') => setNewIncome({...newIncome, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rental">Rental Income</SelectItem>
                        <SelectItem value="other">Other Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="income-amount">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        id="income-amount"
                        type="number"
                        className="pl-8"
                        placeholder="0"
                        value={newIncome.amount || ""}
                        onChange={(e) => setNewIncome({...newIncome, amount: Number(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="income-frequency">Frequency</Label>
                    <Select value={newIncome.frequency} onValueChange={(value: 'monthly' | 'quarterly' | 'annual') => setNewIncome({...newIncome, frequency: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="income-description">Description</Label>
                    <Input
                      id="income-description"
                      placeholder="Optional description"
                      value={newIncome.description}
                      onChange={(e) => setNewIncome({...newIncome, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={handleAddIncome} disabled={newIncome.amount <= 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Income
                  </Button>
                </div>
              </div>

              {/* Income Entries Table */}
              {incomeEntries.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-4">Income Entries ({incomeEntries.length})</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Annual Total</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {incomeEntries.map((income) => (
                          <TableRow key={income.id}>
                            <TableCell className="capitalize">{income.type}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(income.amount)}</TableCell>
                            <TableCell className="capitalize">{income.frequency}</TableCell>
                            <TableCell className="font-semibold text-green-600">
                              {formatCurrency(annualizeAmount(income.amount, income.frequency))}
                            </TableCell>
                            <TableCell>{income.description}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveIncome(income.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Income Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-green-900">Total Annual Income:</span>
                  <span className="text-xl font-bold text-green-900">{formatCurrency(totalIncome)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          {/* Individual Mandatory Expense Sections */}
          {MANDATORY_EXPENSE_TYPES.map((expenseType) => {
            const existingEntries = expenseEntries.filter(expense => expense.category === expenseType.category);
            const formData = newMandatoryExpenses[expenseType.category];

            return (
              <Card key={expenseType.category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">{expenseType.icon}</span>
                    {expenseType.label}
                  </CardTitle>
                  <CardDescription>
                    {expenseType.description} ({expenseType.scheduleE})
                    <br />
                    <span className="text-xs text-gray-500">Examples: {expenseType.examples}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add New Entry Form */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`${expenseType.category}-amount`}>Amount</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            id={`${expenseType.category}-amount`}
                            type="number"
                            className="pl-8"
                            placeholder="0"
                            value={formData.amount || ""}
                            onChange={(e) => handleUpdateMandatoryExpenseForm(expenseType.category, 'amount', Number(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`${expenseType.category}-frequency`}>Frequency</Label>
                        <Select
                          value={formData.frequency}
                          onValueChange={(value: 'one-time' | 'monthly' | 'quarterly' | 'annual') =>
                            handleUpdateMandatoryExpenseForm(expenseType.category, 'frequency', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="one-time">One-time</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor={`${expenseType.category}-description`}>Description</Label>
                        <Input
                          id={`${expenseType.category}-description`}
                          placeholder="Optional description"
                          value={formData.description}
                          onChange={(e) => handleUpdateMandatoryExpenseForm(expenseType.category, 'description', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${expenseType.category}-vendor`}>Vendor/Payee</Label>
                        <Input
                          id={`${expenseType.category}-vendor`}
                          placeholder="Who was paid? (optional)"
                          value={formData.vendor}
                          onChange={(e) => handleUpdateMandatoryExpenseForm(expenseType.category, 'vendor', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${expenseType.category}-date`}>Date</Label>
                        <Input
                          id={`${expenseType.category}-date`}
                          type="date"
                          value={formData.date}
                          onChange={(e) => handleUpdateMandatoryExpenseForm(expenseType.category, 'date', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => handleAddMandatoryExpense(expenseType.category)}
                        disabled={!formData.amount || formData.amount <= 0}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add {expenseType.label}
                      </Button>
                    </div>
                  </div>

                  {/* Existing Entries for this Category */}
                  {existingEntries.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">{expenseType.label} Entries ({existingEntries.length})</h4>
                      <div className="space-y-2">
                        {existingEntries.map((expense) => (
                          <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                            <div className="flex-1">
                              <div className="flex items-center gap-4">
                                <div className="font-semibold text-lg">{formatCurrency(expense.amount)}</div>
                                <div className="text-sm text-gray-600 capitalize">{expense.frequency}</div>
                                <div className="text-sm font-semibold text-red-600">
                                  {formatCurrency(annualizeAmount(expense.amount, expense.frequency))} annual
                                </div>
                              </div>
                              {expense.description && (
                                <div className="text-sm text-gray-500 mt-1">{expense.description}</div>
                              )}
                              {expense.vendor && (
                                <div className="text-xs text-gray-400">Paid to: {expense.vendor}</div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExpense(expense.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Mandatory Expenses Summary */}
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-red-900">Total Required Expenses:</span>
                <span className="text-xl font-bold text-red-900">{formatCurrency(totalMandatoryExpenses)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Optional Expenses Card */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Expenses</CardTitle>
              <CardDescription>
                Add other property-related expenses like repairs, supplies, utilities, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Expense Form */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-4">Add Expense Entry</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="expense-category">Category</Label>
                    <Select
                      value={newExpense.category}
                      onValueChange={(value) => setNewExpense({...newExpense, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPTIONAL_EXPENSE_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label} ({category.scheduleE})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="expense-amount">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        id="expense-amount"
                        type="number"
                        className="pl-8"
                        placeholder="0"
                        value={newExpense.amount || ""}
                        onChange={(e) => setNewExpense({...newExpense, amount: Number(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="expense-frequency">Frequency</Label>
                    <Select value={newExpense.frequency} onValueChange={(value: 'one-time' | 'monthly' | 'quarterly' | 'annual') => setNewExpense({...newExpense, frequency: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-time">One-time</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="expense-date">Date</Label>
                    <Input
                      id="expense-date"
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expense-description">Description</Label>
                    <Input
                      id="expense-description"
                      placeholder="What was this expense for?"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expense-vendor">Vendor/Payee</Label>
                    <Input
                      id="expense-vendor"
                      placeholder="Who was paid? (optional)"
                      value={newExpense.vendor}
                      onChange={(e) => setNewExpense({...newExpense, vendor: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button onClick={handleAddExpense} disabled={!newExpense.category || newExpense.amount <= 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
              </div>

              {/* Optional Expenses Table */}
              {optionalExpenseEntries.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-4">Additional Expenses ({optionalExpenseEntries.length})</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Annual Total</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {optionalExpenseEntries.map((expense) => {
                          const category = OPTIONAL_EXPENSE_CATEGORIES.find(cat => cat.value === expense.category);
                          return (
                            <TableRow key={expense.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{category?.label}</div>
                                  <div className="text-xs text-gray-500">{category?.scheduleE}</div>
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold">{formatCurrency(expense.amount)}</TableCell>
                              <TableCell className="capitalize">{expense.frequency}</TableCell>
                              <TableCell className="font-semibold text-red-600">
                                {formatCurrency(annualizeAmount(expense.amount, expense.frequency))}
                              </TableCell>
                              <TableCell>{expense.description}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveExpense(expense.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-orange-900">Total Additional Expenses:</span>
                  <span className="text-xl font-bold text-orange-900">{formatCurrency(totalOptionalExpenses)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Tax Year {taxYear} Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* P&L Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                      <div className="text-sm text-green-900">Total Income</div>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
                      <div className="text-sm text-red-900">Total Expenses</div>
                    </div>
                  </div>
                  <div className={`border rounded-lg p-4 ${netIncome >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                        {formatCurrency(netIncome)}
                      </div>
                      <div className={`text-sm ${netIncome >= 0 ? 'text-blue-900' : 'text-gray-900'}`}>
                        Net {netIncome >= 0 ? 'Income' : 'Loss'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule E Actions */}
                <div className="border-t pt-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-orange-500" />
                        Tax Reports
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Generate IRS-compliant Schedule E forms for tax filing
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleGenerateScheduleE()}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={isGeneratingReport}
                      >
                        {isGeneratingReport ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Schedule E
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleExportData()}
                        disabled={isGeneratingReport}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </Button>
                    </div>
                  </div>

                  {scheduleEError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{scheduleEError}</p>
                    </div>
                  )}
                </div>

                {/* Detailed Breakdown */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Income & Expense Breakdown</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Income Breakdown */}
                    <div>
                      <h5 className="font-medium mb-3 text-green-700">Income Details</h5>
                      <div className="space-y-2 text-sm">
                        {incomeEntries.map((income) => (
                          <div key={income.id} className="flex justify-between">
                            <span>{income.description}</span>
                            <span className="font-medium">{formatCurrency(annualizeAmount(income.amount, income.frequency))}</span>
                          </div>
                        ))}
                        {incomeEntries.length === 0 && (
                          <div className="text-gray-500 italic">No income entries added</div>
                        )}
                      </div>
                    </div>

                    {/* Expense Breakdown */}
                    <div>
                      <h5 className="font-medium mb-3 text-red-700">Expense Details</h5>
                      <div className="space-y-2 text-sm">
                        {/* All expenses from expenseEntries */}
                        {expenseEntries.map((expense) => {
                          const mandatoryCategory = MANDATORY_EXPENSE_TYPES.find(type => type.category === expense.category);
                          const optionalCategory = OPTIONAL_EXPENSE_CATEGORIES.find(cat => cat.value === expense.category);
                          const categoryLabel = mandatoryCategory?.label || optionalCategory?.label || expense.category;

                          return (
                            <div key={expense.id} className="flex justify-between">
                              <span>{expense.description || categoryLabel}</span>
                              <span className="font-medium">{formatCurrency(annualizeAmount(expense.amount, expense.frequency))}</span>
                            </div>
                          );
                        })}

                        {totalExpenses === 0 && (
                          <div className="text-gray-500 italic">No expenses added</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Auto-save Status - Fixed at bottom */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-600 flex items-center justify-center gap-2">
            <Save className="h-4 w-4 text-green-500" />
            All changes are automatically saved
          </div>
        </CardContent>
      </Card>

      {/* Schedule E Modal */}
      {scheduleEData && (
        <ScheduleEForm
          data={scheduleEData}
          isOpen={showScheduleEModal}
          onClose={() => {
            setShowScheduleEModal(false);
            setScheduleEData(null);
          }}
          propertyId={propertyId}
          taxYear={taxYear}
        />
      )}
    </div>
  );
}