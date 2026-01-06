import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { db, properties, users } from "@/db";
import { eq, and, ne } from "drizzle-orm";

// Input validation schema
const duplicateCheckSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = duplicateCheckSchema.parse(body);
    const { street, city, state, zipCode } = validatedData;

    // Normalize address for comparison (trim and lowercase)
    const normalizeAddress = (addr: string) => addr.trim().toLowerCase();
    const normalizedStreet = normalizeAddress(street);
    const normalizedCity = normalizeAddress(city);
    const normalizedState = normalizeAddress(state);
    const normalizedZip = normalizeAddress(zipCode);

    // Check for exact duplicates in user's properties
    const userDuplicates = await db
      .select({
        id: properties.id,
        street: properties.street,
        city: properties.city,
        state: properties.state,
        zipCode: properties.zipCode,
      })
      .from(properties)
      .innerJoin(users, eq(properties.userId, users.id))
      .where(and(
        eq(users.clerkId, user.id),
        eq(properties.street, street),
        eq(properties.city, city),
        eq(properties.state, state),
        eq(properties.zipCode, zipCode)
      ));

    // Check for potential sharing opportunities (other users with same property)
    const potentialShares = await db
      .select({
        ownerEmail: users.email,
        ownerName: users.name,
        propertyId: properties.id,
        street: properties.street,
        city: properties.city,
        state: properties.state,
      })
      .from(properties)
      .innerJoin(users, eq(properties.userId, users.id))
      .where(and(
        ne(users.clerkId, user.id), // Different user
        eq(properties.street, street),
        eq(properties.city, city),
        eq(properties.state, state),
        eq(properties.zipCode, zipCode)
      ));

    // Format response
    const response = {
      hasDuplicate: userDuplicates.length > 0,
      duplicateProperty: userDuplicates.length > 0 ? userDuplicates[0] : null,
      potentialShares: potentialShares.map(share => ({
        ownerEmail: share.ownerEmail,
        ownerName: share.ownerName || 'Unknown',
        propertyId: share.propertyId,
        address: `${share.street}, ${share.city}, ${share.state}`,
        suggestion: `This property is already managed by ${share.ownerName || share.ownerEmail}. Would you like to request access instead?`
      }))
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Duplicate check error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to check for duplicates" },
      { status: 500 }
    );
  }
}