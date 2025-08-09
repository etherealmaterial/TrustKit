import Stripe from "stripe"
import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }), { status: 500 })
  }
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" as any })

  try {
    const { amount_cents, description } = (await req.json()) as { amount_cents: number; description?: string }
    if (!Number.isFinite(amount_cents) || amount_cents < 50) {
      return new Response(JSON.stringify({ error: "Invalid amount_cents" }), { status: 400 })
    }

    const pi = await stripe.paymentIntents.create({
      amount: Math.round(amount_cents),
      currency: "usd",
      description: description ?? "Payment",
      automatic_payment_methods: { enabled: true },
    })

    return Response.json({ clientSecret: pi.client_secret })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Stripe error" }), { status: 500 })
  }
}
