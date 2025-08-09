import { NextResponse } from "next/server"
import Stripe from "stripe"
import { fetchEthUsd, toCents } from "@/lib/prices"

export async function POST() {
  try {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      return NextResponse.json({ ok: false, error: "Missing STRIPE_SECRET_KEY" }, { status: 500 })
    }
    const stripe = new Stripe(key, { apiVersion: "2024-06-20" })

    // Always re-calc server-side to prevent tampering
    const price = await fetchEthUsd()
    const amount = toCents(price.usd) // 1 ETH in USD cents

    // Create PaymentIntent for Payment Element, Link will appear if eligible
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      description: "Buy 1 ETH",
      automatic_payment_methods: { enabled: true },
      metadata: {
        product: "eth",
        quantity: "1",
        price_source: price.source,
        as_of: price.asOf,
      },
    })

    return NextResponse.json({
      ok: true,
      clientSecret: intent.client_secret,
      currency: intent.currency,
      amount: intent.amount,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Stripe error creating PaymentIntent" },
      { status: 500 },
    )
  }
}
