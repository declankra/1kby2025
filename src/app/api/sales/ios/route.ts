// src/app/api/sales/ios/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // adjust path to your Supabase client
import jwt from "jsonwebtoken";
import { gunzipSync } from "zlib";
import Papa from "papaparse";

// Example table schema:
//
// create table public.apple_sales_history (
//   id uuid default uuid_generate_v4() primary key,
//   created_at timestamp with time zone default now(),
//   report_date date not null,
//   proceeds numeric(10,2) not null
// );
//
// Make sure to enable the extension uuid-ossp if you need it for uuid generation.

interface AppleSalesRow {
  "Developer Proceeds": string;
  [key: string]: string;  // allows for other columns
}

export async function GET(request: NextRequest) {
  try {
    // We consider "yesterday" or "two days ago" because Apple data lags
    const reportDate = getAppleReportDate(2);

    // 1. Check Supabase if we already have data for that day
    const { data: existingRows, error: selectError } = await supabase
      .from("apple_sales_history")
      .select("*")
      .eq("report_date", reportDate);

    if (selectError) {
      console.error("Supabase select error:", selectError);
      return NextResponse.json({ error: "Database read error" }, { status: 500 });
    }

    if (existingRows && existingRows.length > 0) {
      console.log(`Data for ${reportDate} already exists. Skipping Apple fetch.`);
    } else {
      console.log(`No data for ${reportDate} in DB. Fetching Apple CSV...`);
      await fetchAppleSalesAndStore(reportDate);
    }

    // 2. Return all historical data (useful for your chart)
    const { data: allData, error: allDataError } = await supabase
      .from("apple_sales_history")
      .select("*")
      .order("report_date", { ascending: true });

    if (allDataError) {
      console.error("Supabase select all error:", allDataError);
      return NextResponse.json({ error: "Database read error" }, { status: 500 });
    }

    return NextResponse.json(allData);
  } catch (error) {
    console.error("General error in route:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * This function fetches Apple daily sales for a single date, sums all proceeds,
 * and inserts one row into your Supabase table.
 */
async function fetchAppleSalesAndStore(reportDate: string) {
  // 1. Check env vars
  const keyId = process.env.APP_STORE_KEY_ID;
  const issuerId = process.env.APP_STORE_ISSUER_ID;
  const privateKey = process.env.APP_STORE_PRIVATE_KEY;
  const vendorNumber = process.env.APP_STORE_VENDOR_NUMBER;

  if (!keyId || !issuerId || !privateKey || !vendorNumber) {
    console.warn("Missing Apple credentials. Cannot fetch daily sales.");
    return;
  }

  // 2. Generate a short-lived JWT
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

  const url = `https://api.appstoreconnect.apple.com/v1/salesReports?` +
    `filter[frequency]=DAILY&` +
    `filter[reportSubType]=SUMMARY&` +
    `filter[reportType]=SALES&` +
    `filter[vendorNumber]=${vendorNumber}&` +
    `filter[reportDate]=${reportDate}`;

  console.log("Fetching Apple Sales for:", reportDate);
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Apple API error:", errText);
    return;
  }

  // 3. Decompress the gzipped CSV
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const decompressed = gunzipSync(buffer);

  // 4. Parse CSV
  const csvString = decompressed.toString("utf-8");
  const { data } = Papa.parse<AppleSalesRow>(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  // data might have multiple lines for that day
  // Example relevant columns: "Begin Date", "End Date", "Developer Proceeds"
  // We'll sum them
  let totalProceeds = 0;
  data.forEach((row) => {
    const proceedsStr = row["Developer Proceeds"] || "0";
    const numericProceeds = parseFloat(proceedsStr);
    if (!isNaN(numericProceeds)) {
      totalProceeds += numericProceeds;
    }
  });

  // 5. Insert a single row with that day's total proceeds
  console.log(`Summed proceeds for ${reportDate}: ${totalProceeds.toFixed(2)}`);

  const { error: insertError } = await supabase
    .from("apple_sales_history")
    .insert([
      {
        report_date: reportDate,
        proceeds: totalProceeds,
      },
    ]);

  if (insertError) {
    console.error("Supabase insert error:", insertError);
  }
}

/**
 * Decide which day to fetch. Typically Apple sales can lag by 1–2 days, so you can pass offset=2.
 * This returns a string "YYYY-MM-DD".
 */
function getAppleReportDate(daysAgo = 2): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}
