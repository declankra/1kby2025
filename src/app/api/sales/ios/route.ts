// src/app/api/sales/ios/route.ts

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { gunzipSync } from "zlib";
import Papa from "papaparse";

// Optional mock data for fallback
const MOCK_DATA = [
  { date: "2024-08-17", amount: 6.44181 },
  // ... other mock data ...
];

export async function GET(request: NextRequest) {
  try {
    // 1. Verify credentials
    const keyId = process.env.APP_STORE_KEY_ID;
    const issuerId = process.env.APP_STORE_ISSUER_ID;
    const privateKey = process.env.APP_STORE_PRIVATE_KEY;
    const vendorNumber = process.env.APP_STORE_VENDOR_NUMBER;

    if (!keyId || !issuerId || !privateKey || !vendorNumber) {
      console.warn("Missing App Store credentials - falling back to mock data");
      return NextResponse.json(MOCK_DATA);
    }

    // 2. Generate JWT for Apple’s API
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        iss: issuerId,
        iat: now,
        exp: now + 20 * 60, // 20 minutes
        aud: "appstoreconnect-v1",
      },
      privateKey,
      {
        algorithm: "ES256",
        header: {
          alg: "ES256",
          kid: keyId,
          typ: "JWT",
        },
      }
    );

    // 3. Determine the report date (2 days ago to ensure availability)
    const today = new Date();
    const reportDate = new Date(today);
    reportDate.setDate(today.getDate() - 2);
    const formattedDate = reportDate.toISOString().split("T")[0];

    // 4. Fetch gzipped CSV file
    const response = await fetch(
      `https://api.appstoreconnect.apple.com/v1/salesReports?` +
        `filter[frequency]=DAILY&` +
        `filter[reportSubType]=SUMMARY&` +
        `filter[reportType]=SALES&` +
        `filter[vendorNumber]=${vendorNumber}&` +
        `filter[reportDate]=${formattedDate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Check if response is OK, otherwise log and return mock
    if (!response.ok) {
      const errorText = await response.text();
      console.error("App Store API Error:", {
        status: response.status,
        statusText: response.statusText,
        requestDate: formattedDate,
        body: errorText,
      });
      console.warn("API request failed - falling back to mock data");
      return NextResponse.json(MOCK_DATA);
    }

    // 5. Decompress the gzip data
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const decompressed = gunzipSync(buffer);

    // 6. Convert CSV buffer into text
    const csvString = decompressed.toString("utf-8");

    // Debug 1: Show the length and snippet of CSV
    console.log("CSV length:", csvString.length);
    console.log("CSV snippet:\n", csvString.slice(0, 500));

    // 7. Parse CSV to JSON
    const { data, errors, meta } = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
    });

    // Debug 2: Show any Papa parse errors and metadata
    if (errors.length) {
      console.error("Papaparse errors:", errors);
    }
    console.log("Papa parse meta:", meta);
    console.log("Parsed row count:", data.length);

    // Debug 3: Log a sample of the parsed rows
    console.log("First parsed row:", data[0]);

    // 8. Transform parsed data to { date, amount } or your desired fields
    const transformedData = data
      .map((row: any) => ({
        date: row.BeginDate || row.EndDate || formattedDate,
        amount: parseFloat(row.Proceeds || "0"),
      }))
      .filter((item: any) => !isNaN(item.amount));

    // Debug 4: Log sample of transformed data
    console.log("Transformed data sample:", transformedData.slice(0, 3));

    // 9. If no valid data, fall back
    if (!transformedData.length) {
      console.warn("No valid data returned - using mock data");
      return NextResponse.json(MOCK_DATA);
    }

    // 10. Return final data as JSON
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("App Store API error:", error);
    return NextResponse.json(MOCK_DATA);
  }
}
