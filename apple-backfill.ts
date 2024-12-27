require("dotenv/config");
const supabase = require("./src/lib/supabase").supabase;
const jwt = require("jsonwebtoken");
const { gunzipSync } = require("zlib");
const papaparse = require("papaparse");

async function main() {
  console.log("Backfilling Apple sales data for August & December 2024...");

  // We'll fetch 2 months, parse each CSV, and insert only the dates Apple provides.
  const monthConfigs = [
    { label: "August",   reportDate: "2024-08-01" },
    { label: "December", reportDate: "2024-12-01" },
  ];

  for (const { label, reportDate } of monthConfigs) {
    console.log(`Fetching monthly CSV for ${label} 2024...`);
    try {
      const dailyProceedsMap = await fetchMonthlyAppleSales(reportDate);

      if (!dailyProceedsMap) {
        console.warn(`${label} 2024 data is empty or invalid. Skipping...`);
        continue;
      }

      // Insert rows only for the days that appear in Apple’s CSV
      for (const isoDate of Object.keys(dailyProceedsMap)) {
        const proceeds = dailyProceedsMap[isoDate];

        // Check if already exists
        const { data: existingRows, error: selectError } = await supabase
          .from("apple_sales_history")
          .select("*")
          .eq("report_date", isoDate);

        if (selectError) {
          console.error(`Select error for ${isoDate}:`, selectError);
          continue;
        }

        if (existingRows && existingRows.length > 0) {
          console.log(`Already have data for ${isoDate}, skipping.`);
          continue;
        }

        console.log(`Inserting proceeds ${proceeds.toFixed(2)} for ${isoDate}...`);
        const { error: insertError } = await supabase
          .from("apple_sales_history")
          .insert([
            {
              report_date: isoDate, 
              proceeds, 
            },
          ]);

        if (insertError) {
          console.error(`Insert error for ${isoDate}:`, insertError);
        } else {
          console.log(`Inserted proceeds for ${isoDate}`);
        }
      }
    } catch (err) {
      console.error(`Unexpected error backfilling ${label} 2024:`, err);
    }
  }

  console.log("Backfill complete. Exiting...");
  process.exit(0);
}

// Convert Apple date string "08/01/2024" -> "2024-08-01"
function convertAppleDateStringToISO(appleDateString: string) {
  if (!appleDateString) return null;
  const [mm, dd, yyyy] = appleDateString.split("/");
  if (!mm || !dd || !yyyy) return null;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

// Downloads one monthly CSV from Apple (e.g., passing "2024-08-01" gets the August file),
// parses it, and returns a dictionary keyed by day: { "2024-08-01": number, "2024-08-02": number, ... }
async function fetchMonthlyAppleSales(reportDate: string): Promise<{ [date: string]: number } | null> {
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

  // Apple usually returns the entire month of daily rows if we pass "YYYY-MM-01"
  // But if the CSV lumps all days into the same Begin/End Date, Apple is giving you
  // a single monthly total with the same date. We'll still parse it just in case.
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
    console.error(`Apple API error for date ${reportDate}:`, errText);
    return null;
  }

  // Decompress the gzipped CSV
  const arrayBuffer = await response.arrayBuffer();
  const decompressed = gunzipSync(Buffer.from(arrayBuffer));
  const csvString = decompressed.toString("utf-8");

  // Parse CSV
  const { data } = papaparse.parse(csvString, { header: true, skipEmptyLines: true });
  if (!data || !Array.isArray(data)) {
    console.warn("CSV parse returned empty or invalid data.");
    return null;
  }

  // Accumulate daily sums
  const dailyProceeds: { [date: string]: number } = {};

  data.forEach((row: any) => {
    const isoDate = convertAppleDateStringToISO(row["Begin Date"]); 
    // or try row["End Date"] if Apple lumps all data in a single row
    if (!isoDate) return;

    const proceedsStr = row["Developer Proceeds"] || "0";
    const numericProceeds = parseFloat(proceedsStr);

    // Debug log
    console.log(
      `Row => Begin Date: ${row["Begin Date"]} | Developer Proceeds: ${row["Developer Proceeds"]}`
    );
    console.log(`Converted => isoDate: ${isoDate}, proceedsStr: ${proceedsStr}`);

    if (!isNaN(numericProceeds)) {
      dailyProceeds[isoDate] = (dailyProceeds[isoDate] || 0) + numericProceeds;
    }
  });

  return dailyProceeds;
}

// Run the script
main().catch((error) => {
  console.error("Unexpected error in backfill script:", error);
  process.exit(1);
});
