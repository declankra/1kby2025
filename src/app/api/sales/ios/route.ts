// src/app/api/sales/ios/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// In-memory cache
let salesCache: { lastUpdated: number; data: any[] } | null = null;

async function fetchSalesData() {
  // Fetch all sales data from Supabase
  const { data: salesData, error } = await supabase
    .from('ios_sales')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching sales data:', error);
    throw error;
  }

  // Transform the data to match our simplified format
  return salesData.map(record => ({
    date: record.date,
    amount: record.revenue
  }));
}

export async function GET(request: NextRequest) {
  try {
    // Check if we have valid cached data
    if (
      salesCache &&
      salesCache.lastUpdated &&
      Date.now() - salesCache.lastUpdated < CACHE_DURATION
    ) {
      return NextResponse.json(salesCache.data);
    }

    // Fetch fresh data
    const data = await fetchSalesData();

    // Update cache
    salesCache = {
      lastUpdated: Date.now(),
      data
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in iOS sales API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch iOS sales data' },
      { status: 500 }
    );
  }
}