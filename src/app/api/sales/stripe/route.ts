// app/api/sales/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function GET(request: NextRequest) {
  try {
    const startDate = Math.floor(new Date('2024-03-04').getTime() / 1000);
    const endDate = Math.floor(Date.now() / 1000);

    const params: Stripe.ChargeListParams = {
      created: {
        gte: startDate,
        lte: endDate,
      },
    };
    const charges = await stripe.charges.list(params);

    // Group charges by date
    const dailyRevenue = charges.data.reduce((acc: { [key: string]: number }, charge) => {
      const date = new Date(charge.created * 1000).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + (charge.amount / 100); // Convert from cents to dollars
      return acc;
    }, {});

    // Convert to array format for the chart
    const transformedData = Object.entries(dailyRevenue).map(([date, amount]) => ({
      date,
      amount,
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Stripe API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Stripe data' },
      { status: 500 }
    );
  }
}