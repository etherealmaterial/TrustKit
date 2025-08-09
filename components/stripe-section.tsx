"use client"

import { useEffect, useMemo, useState } from "react"
import { loadStripe, type Stripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
const stripePromise: Promise<Stripe | null> = loadStripe(pk)

function CheckoutInner() {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!stripe || !elements) return
    setIsSubmitting(true)
    setError(null)
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/buy-eth/success`,
        },
        redirect: "if_required",
      })
      if (error) {
        setError(error.message || "Payment failed.")
      } else if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
        window.location.href = `/buy-eth/success?pi=${paymentIntent.id}`
      } else {
        // In case of requires_action redirects handled by Stripe
      }
    } catch (err: any) {
      setError(err?.message ?? "Payment error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <PaymentElement />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button onClick={handleSubmit} disabled={!stripe || isSubmitting} className="w-full">
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Processing...
          </span>
        ) : (
          "Pay with Link / Card"
        )}
      </Button>
    </div>
  )
}

export default function StripeSection() {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/stripe/create-payment-intent", { method: "POST" })
        const json = await res.json()
        if (!res.ok || !json?.ok || !json?.clientSecret) {
          throw new Error(json?.error || "Failed to create PaymentIntent")
        }
        if (active) setClientSecret(json.clientSecret)
      } catch (err: any) {
        if (active) setError(err?.message ?? "Failed to initialize Stripe")
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [])

  const options = useMemo(
    () => ({
      clientSecret: clientSecret || undefined,
      appearance: { theme: "stripe" as const },
    }),
    [clientSecret],
  )

  if (!pk) {
    return <p className="text-sm text-destructive">Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</p>
  }

  return (
    <Card>
      <CardContent className="p-4">
        {loading && <p className="text-sm text-muted-foreground">Preparing payment...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && clientSecret ? (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutInner />
          </Elements>
        ) : null}
      </CardContent>
    </Card>
  )
}
