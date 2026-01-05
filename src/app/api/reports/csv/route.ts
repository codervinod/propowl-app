import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import {
  exportPropertyToCSV,
  exportSummaryToCSV,
  generateCSVFilename,
} from "@/lib/schedule-e/csv-exporter";
import {
  ScheduleEData,
  ScheduleESummary,
  ScheduleEExportFormat,
} from "@/lib/schedule-e/types";

/**
 * GET /api/reports/csv?propertyId=&taxYear=&includeAllProperties=&format=
 * Generate and download Schedule E CSV
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const taxYear = parseInt(searchParams.get("taxYear") || new Date().getFullYear().toString());
    const includeAllProperties = searchParams.get("includeAllProperties") === "true";
    const format = (searchParams.get("format") || "csv") as ScheduleEExportFormat;

    // Validate format
    if (!["csv", "turbotax", "quickbooks"].includes(format)) {
      return NextResponse.json({ error: "Invalid export format" }, { status: 400 });
    }

    // Fetch Schedule E data from our existing API endpoint
    const scheduleEUrl = new URL(`${request.nextUrl.origin}/api/schedule-e`);
    scheduleEUrl.searchParams.set("taxYear", taxYear.toString());
    if (propertyId && !includeAllProperties) {
      scheduleEUrl.searchParams.set("propertyId", propertyId);
    }
    if (includeAllProperties) {
      scheduleEUrl.searchParams.set("includeAllProperties", "true");
    }

    const scheduleEResponse = await fetch(scheduleEUrl.toString(), {
      headers: {
        // Forward the authorization from the original request
        cookie: request.headers.get("cookie") || "",
      },
    });

    if (!scheduleEResponse.ok) {
      throw new Error("Failed to fetch Schedule E data");
    }

    const scheduleEResult = await scheduleEResponse.json();

    if (!scheduleEResult.success || !scheduleEResult.data) {
      throw new Error(scheduleEResult.error || "No Schedule E data found");
    }

    const data: ScheduleEData | ScheduleESummary = scheduleEResult.data;

    // Generate CSV content
    let csvContent: string;
    if ("properties" in data) {
      // Multi-property summary
      csvContent = exportSummaryToCSV(data, format);
    } else {
      // Single property
      csvContent = exportPropertyToCSV(data, format);
    }

    // Generate filename
    const filename = generateCSVFilename(data, format);

    // Return CSV as download
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    console.error("Error generating CSV:", error);
    return NextResponse.json(
      {
        error: "Failed to generate CSV",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports/csv
 * Alternative endpoint for complex CSV requests with body data
 */
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, taxYear, includeAllProperties, format = "csv" } = body;

    // Construct URL for GET request
    const searchParams = new URLSearchParams({
      taxYear: taxYear.toString(),
      includeAllProperties: includeAllProperties.toString(),
      format: format,
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
    console.error("Error in CSV POST endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to process CSV request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}