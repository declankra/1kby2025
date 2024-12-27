// apple-backfill.ts
require("dotenv/config");
const { supabase } = require("./src/lib/supabase");
const jwt = require("jsonwebtoken");
const { gunzipSync } = require("zlib");
const papaparse = require("papaparse");

// Adjust table name if needed. This script expects a table named `apple_sales_history`:
// create table public.apple_sales_history (
//   id uuid default uuid_generate_v4() primary key,
//   created_at timestamp with time zone default now(),
//   report_date date not null,
//   proceeds numeric(10,2) not null
// );

async function main() {
  console.log("Backfilling Apple sales data for August & December 2024...");

  // 1. Generate all dates in August and December 2024
  const augustDates = generateDateRange("2024-08-01", "2024-08-31");
  const decemberDates = generateDateRange("2024-12-01", "2024-12-31");
  const allDates = [...augustDates, ...decemberDates];

  // 2. Loop each date, fetch Apple CSV, sum proceeds, insert row in Supabase
  for (const date of allDates) {
    try {
      // First, check if that date already exists in the DB
      const { data: existingRows, error: selectError } = await supabase
        .from("apple_sales_history")
        .select("*")
        .eq("report_date", date);

      if (selectError) {
        console.error(`Supabase select error for date ${date}:`, selectError);
        continue;
      }

      if (existingRows && existingRows.length > 0) {
        console.log(`Already have data for ${date}, skipping.`);
        continue;
      }

      console.log(`Fetching sales for ${date}...`);
      const totalProceeds = await fetchAppleSalesSum(date);

      if (totalProceeds === null) {
        // Means an error occurred or the Apple fetch failed
        console.warn(`Could not fetch Apple data for ${date}`);
        continue;
      }

      console.log(`  Summed proceeds: ${totalProceeds.toFixed(2)}`);

      // Insert a single row with that date's proceeds
      const { error: insertError } = await supabase
        .from("apple_sales_history")
        .insert([
          {
            report_date: date,
            proceeds: totalProceeds,
          },
        ]);

      if (insertError) {
        console.error(`Supabase insert error for date ${date}:`, insertError);
      } else {
        console.log(`  Inserted proceeds for ${date}`);
      }
    } catch (error) {
      console.error(`Error processing date ${date}:`, error);
    }
  }

  console.log("Backfill complete. Exiting...");
  process.exit(0);
}

// Utility: create an array of date strings in YYYY-MM-DD format.
function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = new Date(start);
  const final = new Date(end);

  while (current <= final) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// Fetch Apple CSV for one day, sum Developer Proceeds, return the total.
async function fetchAppleSalesSum(reportDate: string): Promise<number | null> {
  const keyId = process.env.APP_STORE_KEY_ID;
  const issuerId = process.env.APP_STORE_ISSUER_ID;
  const privateKey = process.env.APP_STORE_PRIVATE_KEY;
  const vendorNumber = process.env.APP_STORE_VENDOR_NUMBER;

  if (!keyId || !issuerId || !privateKey || !vendorNumber) {
    console.error("Missing Apple credentials. Cannot proceed.");
    return null;
  }

  // Generate a short-lived JWT
  const now = Math.floor(Date.now() / 1000);
  const token = jwt.sign(
    {
      iss: issuerId,
      iat: now,
      exp: now + 20 * 60,
      aud: "appstoreconnect-v1",
    },
    privateKey,
    {
      algorithm: "ES256",
      header: { alg: "ES256", kid: keyId, typ: "JWT" },
    }
  );

  const url =
    `https://api.appstoreconnect.apple.com/v1/salesReports?` +
    `filter[frequency]=DAILY&` +
    `filter[reportSubType]=SUMMARY&` +
    `filter[reportType]=SALES&` +
    `filter[vendorNumber]=${vendorNumber}&` +
    `filter[reportDate]=${reportDate}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Apple API Error for date ${reportDate}:`, errText);
    return null;
  }

  // Decompress the gzipped CSV
  const arrayBuffer = await response.arrayBuffer();
  const decompressed = gunzipSync(Buffer.from(arrayBuffer));
  const csvString = decompressed.toString("utf-8");

  // Parse CSV
  const { data } = papaparse.parse(csvString, { header: true, skipEmptyLines: true });
  let totalProceeds = 0;

  data.forEach((row: any) => {
    const proceedsStr = row["Developer Proceeds"] || "0";
    const numericProceeds = parseFloat(proceedsStr);
    if (!isNaN(numericProceeds)) {
      totalProceeds += numericProceeds;
    }
  });

  return totalProceeds;
}

// Run the script
main().catch((error) => {
  console.error("Unexpected error in backfill script:", error);
  process.exit(1);
});
