import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db, properties, users, incomeEntries, expenses } from "@/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import {
  generateScheduleEData,
  generateScheduleESummary,
} from "@/lib/schedule-e/calculations";
import {
  ScheduleEProperty,
  ScheduleERequest,
  ScheduleEResponse,
} from "@/lib/schedule-e/types";

// Validation schema for Schedule E request
const scheduleERequestSchema = z.object({
  propertyId: z.string().optional(),
  taxYear: z.number().min(2020).max(2030),
  includeAllProperties: z.boolean().default(false),
});

/**
 * GET /api/schedule-e
 * Generate Schedule E data for a property or all properties for a tax year
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const requestData: ScheduleERequest = {
      propertyId: searchParams.get("propertyId") || undefined,
      taxYear: parseInt(searchParams.get("taxYear") || new Date().getFullYear().toString()),
      includeAllProperties: searchParams.get("includeAllProperties") === "true",
    };

    // Validate request data
    const validationResult = scheduleERequestSchema.safeParse(requestData);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request parameters",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { propertyId, taxYear, includeAllProperties } = validationResult.data;

    // Get user's properties
    const whereConditions = [eq(users.clerkId, user.id)];

    // Filter by specific property if requested
    if (propertyId && !includeAllProperties) {
      whereConditions.push(eq(properties.id, propertyId));
    }

    const userProperties = await db
      .select({
        property: properties,
      })
      .from(properties)
      .innerJoin(users, eq(properties.userId, users.id))
      .where(and(...whereConditions));

    if (userProperties.length === 0) {
      return NextResponse.json(
        { error: includeAllProperties ? "No properties found" : "Property not found" },
        { status: 404 }
      );
    }

    // Generate Schedule E data for each property
    const scheduleEDataList = await Promise.all(
      userProperties.map(async ({ property }) => {
        // Fetch income entries for this property and tax year
        const propertyIncomeEntries = await db
          .select()
          .from(incomeEntries)
          .where(
            and(
              eq(incomeEntries.propertyId, property.id),
              eq(incomeEntries.taxYear, taxYear)
            )
          );

        // Fetch expenses for this property and tax year
        const propertyExpenses = await db
          .select()
          .from(expenses)
          .where(
            and(
              eq(expenses.propertyId, property.id),
              eq(expenses.taxYear, taxYear)
            )
          );

        // Transform property data to ScheduleEProperty format
        const scheduleEProperty: ScheduleEProperty = {
          id: property.id,
          address: {
            street: property.street,
            streetLine2: property.streetLine2,
            city: property.city,
            state: property.state,
            zipCode: property.zipCode,
          },
          propertyType: property.propertyType,
          purchaseDate: property.purchaseDate,
          purchasePrice: parseFloat(property.purchasePrice),
          landValue: parseFloat(property.landValue),
        };

        // Transform income entries
        const incomeData = propertyIncomeEntries.map((entry) => ({
          amount: parseFloat(entry.amount),
          frequency: entry.frequency as "monthly" | "quarterly" | "annual" | "one_time",
          description: entry.description || "",
        }));

        // Transform expenses
        const expenseData = propertyExpenses.map((expense) => ({
          category: expense.category,
          amount: parseFloat(expense.amount),
        }));

        // Generate Schedule E data
        return generateScheduleEData(
          scheduleEProperty,
          taxYear,
          incomeData,
          expenseData
        );
      })
    );

    // Return single property data or summary
    if (scheduleEDataList.length === 1 && !includeAllProperties) {
      const response: ScheduleEResponse = {
        success: true,
        data: scheduleEDataList[0],
      };
      return NextResponse.json(response);
    } else {
      // Return summary for multiple properties
      const summary = generateScheduleESummary(scheduleEDataList);
      const response: ScheduleEResponse = {
        success: true,
        data: summary,
      };
      return NextResponse.json(response);
    }

  } catch (error) {
    console.error("Error generating Schedule E data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate Schedule E data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schedule-e
 * Alternative endpoint for complex Schedule E requests with body data
 */
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = scheduleERequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    // For POST requests, we can handle more complex scenarios
    // For now, redirect to GET logic
    const { propertyId, taxYear, includeAllProperties } = validationResult.data;

    // Construct URL for GET request
    const searchParams = new URLSearchParams({
      taxYear: taxYear.toString(),
      includeAllProperties: includeAllProperties.toString(),
    });

    if (propertyId) {
      searchParams.set("propertyId", propertyId);
    }

    const url = new URL(request.url);
    url.search = searchParams.toString();

    // Create a new request with GET method
    const getRequest = new NextRequest(url.toString(), {
      method: "GET",
      headers: request.headers,
    });

    return GET(getRequest);

  } catch (error) {
    console.error("Error in Schedule E POST endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process Schedule E request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}