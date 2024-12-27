// app/api/sales/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { SalesData, DailyProductRevenue, CachedSalesData, PRODUCTS } from "@/types/supabase";

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// In-memory cache
let salesCache: CachedSalesData | null = null;

function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let currentDate = new Date(startDate);
  const lastDate = new Date(endDate);

  while (currentDate <= lastDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

async function fetchSalesData(): Promise<DailyProductRevenue[]> {
  // Fetch all sales data from Supabase
  const { data: salesData, error } = await supabase
    .from('ios_sales')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching sales data:', error);
    throw error;
  }

  // Find date range
  const dates = salesData.length > 0 ? salesData.map(item => item.date) : [];
  const startDate = dates.length > 0 ? Math.min(...dates.map(d => new Date(d).getTime())) : new Date('2024-01-01').getTime();
  const endDate = dates.length > 0 ? Math.max(...dates.map(d => new Date(d).getTime())) : new Date().getTime();

  // Generate continuous date range
  const dateRange = generateDateRange(
    new Date(startDate).toISOString().split('T')[0],
    new Date(endDate).toISOString().split('T')[0]
  );

  // Initialize revenue data for each date with all products
  const revenueByDate = dateRange.reduce((acc: { [key: string]: DailyProductRevenue }, date) => {
    acc[date] = {
      date,
      ...PRODUCTS.reduce((products, product) => ({
        ...products,
        [product.name]: 0
      }), {})
    };
    return acc;
  }, {});

  // Fill in actual revenue data
  salesData.forEach((sale: SalesData) => {
    const product = PRODUCTS.find(p => p.id === sale.product);
    if (product && revenueByDate[sale.date]) {
      revenueByDate[sale.date][product.name] = 
        (revenueByDate[sale.date][product.name] as number) + sale.revenue;
    }
  });

  // Convert to array and sort by date
  return Object.values(revenueByDate).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
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
    console.error('Error in sales API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    );
  }
}