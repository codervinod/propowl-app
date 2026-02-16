import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db, properties, users } from "@/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Schema for property updates - reuse from create endpoint but make fields optional
const updatePropertySchema = z.object({
  // Address
  street: z.string().min(1, "Street is required").optional(),
  streetLine2: z.string().optional(),
  city: z.string().min(1, "City is required").optional(),
  state: z.string().length(2, "State must be 2 characters").optional(),
  zipCode: z.string().min(5, "ZIP code is required").optional(),

  // Property details
  propertyType: z.enum(["single_family", "condo", "townhouse", "multi_family", "apartment"]).optional(),
  purchaseDate: z.string().min(1, "Purchase date is required").optional(),
  purchasePrice: z.number().min(1, "Purchase price must be positive").optional(),
  landValue: z.number().min(0, "Land value must be non-negative").optional(),
});

// Helper function to verify user owns the property
async function verifyPropertyOwnership(propertyId: string, clerkUserId: string) {
  const result = await db
    .select({ propertyId: properties.id })
    .from(properties)
    .innerJoin(users, eq(properties.userId, users.id))
    .where(and(
      eq(properties.id, propertyId),
      eq(users.clerkId, clerkUserId)
    ))
    .limit(1);

  return result.length > 0;
}

// PUT /api/properties/[id] - Update property
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const propertyId = (await params).id;

    // Verify user owns this property
    const hasAccess = await verifyPropertyOwnership(propertyId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = updatePropertySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Convert YYYY-MM to YYYY-MM-01 for database date field if purchaseDate is provided
    if (updateData.purchaseDate) {
      updateData.purchaseDate = updateData.purchaseDate.includes('-')
        ? updateData.purchaseDate + '-01'  // Add day if it's YYYY-MM format
        : updateData.purchaseDate;
    }

    // Convert numbers to strings for database storage
    const dbUpdateData: Record<string, string | undefined> = {};

    // Copy string fields directly
    if (updateData.street !== undefined) dbUpdateData.street = updateData.street;
    if (updateData.streetLine2 !== undefined) dbUpdateData.streetLine2 = updateData.streetLine2;
    if (updateData.city !== undefined) dbUpdateData.city = updateData.city;
    if (updateData.state !== undefined) dbUpdateData.state = updateData.state;
    if (updateData.zipCode !== undefined) dbUpdateData.zipCode = updateData.zipCode;
    if (updateData.propertyType !== undefined) dbUpdateData.propertyType = updateData.propertyType;
    if (updateData.purchaseDate !== undefined) dbUpdateData.purchaseDate = updateData.purchaseDate;

    // Convert number fields to strings
    if (updateData.purchasePrice !== undefined) {
      dbUpdateData.purchasePrice = updateData.purchasePrice.toString();
    }
    if (updateData.landValue !== undefined) {
      dbUpdateData.landValue = updateData.landValue.toString();
    }

    // Update the property
    const updatedProperty = await db
      .update(properties)
      .set({
        ...dbUpdateData,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, propertyId))
      .returning();

    if (updatedProperty.length === 0) {
      return NextResponse.json(
        { error: "Failed to update property" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      property: updatedProperty[0],
    });

  } catch (error) {
    console.error("Error updating property:", error);
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id] - Delete property
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const propertyId = (await params).id;

    // Verify user owns this property
    const hasAccess = await verifyPropertyOwnership(propertyId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Delete the property (CASCADE will handle related data)
    const deletedProperty = await db
      .delete(properties)
      .where(eq(properties.id, propertyId))
      .returning();

    if (deletedProperty.length === 0) {
      return NextResponse.json(
        { error: "Failed to delete property" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Property and all related data deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}