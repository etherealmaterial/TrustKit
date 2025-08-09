import { NextResponse } from "next/server"
import Stripe from "stripe"
import { fetchEthUsdPrice, toUsdCents } from "@/lib/prices"

export async function POST() {
  try {
    const secret = process.env.STRIPE_SECRET_KEY
    if (!secret) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 })
    }

    const stripe = new Stripe(secret, { apiVersion: "2024-06-20" })

    // Price 1 ETH in USD cents
    const usd = await fetchEthUsdPrice()
    const amount = toUsdCents(usd)

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      description: "Buy 1 ETH (fiat payment only)",
      // Enable Link and cards
      payment_method_types: ["card", "link"],
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        asset: "ETH",
        quantity: "1",
        priced_from: "coingecko",
      },
    })

    return NextResponse.json({ clientSecret: intent.client_secret })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Stripe initialization failed" }, { status: 500 })
  }
}
