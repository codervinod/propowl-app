import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db, properties, users, rentalIncome, expenses, incomeEntries } from "@/db";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";

// Schema for tax year data
const saveTaxYearDataSchema = z.object({
  propertyId: z.string().uuid(),
  taxYear: z.number().min(2020).max(2030),
  incomes: z.array(z.object({
    type: z.enum(["rental", "other"]),
    amount: z.number().min(0),
    frequency: z.enum(["one_time", "monthly", "quarterly", "annual"]),
    description: z.string().optional().default(""),
  })).default([]),
  expenses: z.array(z.object({
    category: z.enum([
      "advertising", "auto_travel", "cleaning_maintenance", "commissions",
      "insurance", "legal_professional", "management_fees", "mortgage_interest",
      "other_interest", "repairs", "supplies", "property_taxes", "utilities",
      "depreciation", "other"
    ]),
    amount: z.number().min(0),
    frequency: z.enum(["one_time", "monthly", "quarterly", "annual"]),
    description: z.string().optional().default(""),
    vendor: z.string().optional().default(""),
    date: z.string(), // ISO date string
  })).default([]),
  // Backward compatibility
  grossRent: z.number().min(0).optional().default(0),
  otherIncome: z.number().min(0).optional().default(0),
});

// POST /api/tax-year - Save tax year data
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = saveTaxYearDataSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    const { propertyId, taxYear, incomes, expenses: expenseList, grossRent, otherIncome } = validationResult.data;

    // Verify user owns the property
    const propertyCheck = await db
      .select({ id: properties.id })
      .from(properties)
      .innerJoin(users, eq(properties.userId, users.id))
      .where(and(
        eq(properties.id, propertyId),
        eq(users.clerkId, user.id)
      ));

    if (propertyCheck.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Save all data (no transactions in neon-http driver)

    // Delete existing income entries for this property/tax year
    await db
      .delete(incomeEntries)
      .where(and(
        eq(incomeEntries.propertyId, propertyId),
        eq(incomeEntries.taxYear, taxYear)
      ));

    // Insert new income entries with proper frequency
    if (incomes.length > 0) {
      await db.insert(incomeEntries).values(
        incomes.map((income, index) => ({
          propertyId,
          taxYear,
          type: income.type,
          amount: income.amount.toString(),
          frequency: income.frequency,
          description: income.description || (income.type === 'rental' ? 'Rental Income' : 'Other Income'),
          sortOrder: index,
        }))
      );
    } else if (grossRent > 0) {
      // Backward compatibility: convert old grossRent to income entry
      await db.insert(incomeEntries).values({
        propertyId,
        taxYear,
        type: 'rental',
        amount: grossRent.toString(),
        frequency: 'annual',
        description: 'Gross Rental Income',
        sortOrder: 0,
      });
    }

    // Keep old rentalIncome table for backward compatibility
    await db
      .delete(rentalIncome)
      .where(and(
        eq(rentalIncome.propertyId, propertyId),
        eq(rentalIncome.taxYear, taxYear)
      ));

    await db.insert(rentalIncome).values({
      propertyId,
      taxYear,
      grossRent: grossRent.toString(),
    });

    // Delete existing expenses for this property/tax year
    await db
      .delete(expenses)
      .where(and(
        eq(expenses.propertyId, propertyId),
        eq(expenses.taxYear, taxYear)
      ));

    // Insert new expenses with frequency and ordering
    if (expenseList.length > 0) {
      await db.insert(expenses).values(
        expenseList.map((expense, index) => ({
          propertyId,
          taxYear,
          date: expense.date,
          category: expense.category,
          amount: expense.amount.toString(),
          frequency: expense.frequency,
          description: expense.description,
          vendor: expense.vendor,
          sortOrder: index,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      message: `Tax year ${taxYear} data saved successfully`,
    });

  } catch (error) {
    console.error("Error saving tax year data:", error);
    return NextResponse.json(
      { error: "Failed to save tax year data" },
      { status: 500 }
    );
  }
}

// GET /api/tax-year?propertyId=&taxYear= - Get tax year data
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const taxYear = searchParams.get("taxYear");

    if (!propertyId || !taxYear) {
      return NextResponse.json(
        { error: "propertyId and taxYear are required" },
        { status: 400 }
      );
    }

    // Verify user owns the property
    const propertyCheck = await db
      .select({ id: properties.id })
      .from(properties)
      .innerJoin(users, eq(properties.userId, users.id))
      .where(and(
        eq(properties.id, propertyId),
        eq(users.clerkId, user.id)
      ));

    if (propertyCheck.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Fetch income entries with ordering
    const incomeData = await db
      .select()
      .from(incomeEntries)
      .where(and(
        eq(incomeEntries.propertyId, propertyId),
        eq(incomeEntries.taxYear, parseInt(taxYear))
      ))
      .orderBy(asc(incomeEntries.sortOrder));

    // Fetch expenses with ordering
    const expenseData = await db
      .select()
      .from(expenses)
      .where(and(
        eq(expenses.propertyId, propertyId),
        eq(expenses.taxYear, parseInt(taxYear))
      ))
      .orderBy(asc(expenses.sortOrder), asc(expenses.createdAt));

    // Fetch old rental income for backward compatibility
    const oldIncomeData = await db
      .select()
      .from(rentalIncome)
      .where(and(
        eq(rentalIncome.propertyId, propertyId),
        eq(rentalIncome.taxYear, parseInt(taxYear))
      ))
      .limit(1);

    const oldIncome = oldIncomeData[0] || null;

    return NextResponse.json({
      success: true,
      data: {
        // New structured income entries
        incomes: incomeData.map(income => ({
          id: income.id,
          type: income.type,
          amount: parseFloat(income.amount),
          frequency: income.frequency,
          description: income.description || "",
        })),
        // Backward compatibility
        grossRent: oldIncome ? parseFloat(oldIncome.grossRent || "0") : 0,
        otherIncome: 0,
        expenses: expenseData.map(expense => ({
          id: expense.id,
          category: expense.category,
          amount: parseFloat(expense.amount),
          frequency: expense.frequency || "one_time", // Handle legacy data
          description: expense.description || "",
          vendor: expense.vendor || "",
          date: expense.date,
        })),
      },
    });

  } catch (error) {
    console.error("Error fetching tax year data:", error);
    return NextResponse.json(
      { error: "Failed to fetch tax year data" },
      { status: 500 }
    );
  }
}