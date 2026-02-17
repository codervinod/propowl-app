import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db, properties, users } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Schema for property creation
const createPropertySchema = z.object({
  // Address
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "State must be 2 characters"),
  zipCode: z.string().min(5, "ZIP code is required"),

  // Property details
  propertyType: z.enum(["single_family", "condo", "townhouse", "multi_family", "apartment"]),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  purchasePrice: z.number().min(1, "Purchase price must be positive"),
  landValue: z.number().min(0, "Land value must be non-negative"),
  customDepreciation: z.number().min(0, "Custom depreciation must be positive").optional(),
});

// POST /api/properties - Create new property
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createPropertySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    const propertyData = validationResult.data;

    // Check if user exists in our database, create if not
    let dbUser = await db.select().from(users).where(eq(users.clerkId, user.id)).limit(1);

    if (dbUser.length === 0) {
      // Create user record
      await db.insert(users).values({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : undefined,
      });

      // Fetch the newly created user
      dbUser = await db.select().from(users).where(eq(users.clerkId, user.id)).limit(1);
    }

    const userId = dbUser[0].id;

    // Convert YYYY-MM to YYYY-MM-01 for database date field
    const purchaseDate = propertyData.purchaseDate.includes('-')
      ? propertyData.purchaseDate + '-01'  // Add day if it's YYYY-MM format
      : propertyData.purchaseDate;

    // Create property record
    const newProperty = await db.insert(properties).values({
      userId,
      street: propertyData.street,
      city: propertyData.city,
      state: propertyData.state,
      zipCode: propertyData.zipCode,
      propertyType: propertyData.propertyType,
      purchaseDate: purchaseDate,
      purchasePrice: propertyData.purchasePrice.toString(),
      landValue: propertyData.landValue.toString(),
      customDepreciation: propertyData.customDepreciation?.toString(),
      managementType: "self_managed", // Default for now
      wizardStep: 2, // Completed the 2-step wizard
      wizardComplete: true,
    }).returning();

    return NextResponse.json({
      success: true,
      property: newProperty[0],
    });

  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}

// GET /api/properties - List user's properties
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's properties
    const userProperties = await db
      .select()
      .from(properties)
      .innerJoin(users, eq(properties.userId, users.id))
      .where(eq(users.clerkId, user.id));

    return NextResponse.json({
      success: true,
      properties: userProperties.map(row => row.properties),
    });

  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}