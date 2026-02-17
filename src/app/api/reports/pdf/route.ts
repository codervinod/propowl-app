import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import {
  generateReportFilename,
  scheduleEToHTML,
  summaryToHTML,
} from "@/lib/schedule-e/pdf-generator-simple";
import {
  ScheduleEData,
  ScheduleESummary,
} from "@/lib/schedule-e/types";

/**
 * GET /api/reports/pdf?propertyId=&taxYear=&includeAllProperties=
 * Generate and download Schedule E PDF
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

    // Generate HTML content for PDF
    let htmlContent: string;
    if ("properties" in data) {
      // Multi-property summary
      htmlContent = summaryToHTML(data);
    } else {
      // Single property
      htmlContent = scheduleEToHTML(data);
    }

    // Generate PDF using Puppeteer with serverless Chrome
    const isLocal = process.env.NODE_ENV === 'development';

    const browser = await puppeteer.launch({
      args: isLocal
        ? ['--no-sandbox', '--disable-setuid-sandbox']
        : [
            ...chromium.args,
            '--hide-scrollbars',
            '--disable-web-security',
            '--font-render-hinting=none'
          ],
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: isLocal
        ? undefined // Use local Chrome in development
        : await chromium.executablePath(),
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'letter',
        printBackground: true,
        margin: {
          top: '1in',
          bottom: '1in',
          left: '0.75in',
          right: '0.75in'
        }
      });

      await browser.close();

      // Generate filename
      const filename = generateReportFilename(data, 'pdf');

      // Return PDF as download
      const buffer = new ArrayBuffer(pdfBuffer.byteLength);
      const view = new Uint8Array(buffer);
      view.set(pdfBuffer);

      return new Response(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-cache",
        },
      });

    } catch (pdfError) {
      await browser.close();
      throw pdfError;
    }

  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reports/pdf
 * Alternative endpoint for complex PDF requests with body data
 */
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, taxYear, includeAllProperties } = body;

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
    console.error("Error in PDF POST endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to process PDF request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}