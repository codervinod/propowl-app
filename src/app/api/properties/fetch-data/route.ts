import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchPropertyData } from "@/lib/services/property-data";

// Request validation schema
const fetchDataSchema = z.object({
  placeId: z.string().min(1, "Place ID is required"),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zipCode: z.string().min(5),
    formattedAddress: z.string().min(1),
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request
    const validationResult = fetchDataSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { placeId, address } = validationResult.data;

    // Fetch property data from various sources
    const propertyData = await fetchPropertyData(placeId, address);

    // Return the fetched data
    return NextResponse.json({
      success: true,
      data: propertyData,
    });

  } catch (error) {
    console.error("Property data fetch error:", error);

    // Return graceful error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch property data",
        message: "Unable to retrieve property information at this time. You can continue with manual entry.",
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "property-data-fetch",
    timestamp: new Date().toISOString(),
  });
}