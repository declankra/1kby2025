// app/api/stripe/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Create Stripe instance with latest API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json()
    const { amount, name, message } = body

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      )
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100), // Ensure whole number
      currency: "usd",

      metadata: {
        name,
        message,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json(
      { error: "Error creating payment intent" },
      { status: 500 }
    )
  }
}