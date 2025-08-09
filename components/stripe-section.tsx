"use client"

import { useEffect, useMemo, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"

type Props = { amountUsd: number }

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit() {
    if (!stripe || !elements) return
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // You can route to a success page if desired
          return_url:
            typeof window !== "undefined" && window.location?.origin
              ? `${window.location.origin}/buy-eth/success`
              : undefined,
        },
        redirect: "if_required",
      })
      if (error) {
        setMessage(error.message ?? "Payment failed")
      } else {
        setMessage("Payment succeeded or requires additional action.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <PaymentElement />
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={loading || !stripe || !elements}>
          {loading ? "Processing..." : "Pay with Link / Card"}
        </Button>
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}

export default function StripeSection({ amountUsd }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const options = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: { theme: "stripe" as const },
          }
        : undefined,
    [clientSecret],
  )

  useEffect(() => {
    const amountCents = Math.max(50, Math.round(amountUsd * 100)) // enforce >= $0.50
    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount_cents: amountCents, description: "Buy 1 ETH" }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      })
      .then((data: { clientSecret: string }) => setClientSecret(data.clientSecret))
      .catch((e) => setError(e.message || "Failed to initialize Stripe"))
  }, [amountUsd])

  if (error) {
    return <p className="text-sm text-red-600">{`Stripe initialization error: ${error}`}</p>
  }
  if (!clientSecret || !options) {
    return <p className="text-sm text-muted-foreground">Preparing secure Stripe checkout…</p>
  }
  if (!stripePromise) {
    return <p className="text-sm text-red-600">Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</p>
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm clientSecret={clientSecret} />
    </Elements>
  )
}
