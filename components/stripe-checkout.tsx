"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setMessage(null)
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/buy-eth/success`,
      },
      redirect: "if_required",
    })
    if (error) setMessage(error.message ?? "Payment failed")
    else setMessage("Payment processed")
    setSubmitting(false)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!stripe || submitting}>
          {submitting ? "Processing..." : "Pay with Link / Card"}
        </Button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </form>
  )
}

export default function StripeCheckout() {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const stripePromise = useMemo(() => (stripeKey ? loadStripe(stripeKey) : null), [stripeKey])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch("/api/stripe/create-payment-intent", { method: "POST" })
        const json = (await res.json()) as { ok: boolean; clientSecret?: string; error?: string }
        if (!mounted) return
        if (json.ok && json.clientSecret) setClientSecret(json.clientSecret)
        else setError(json.error ?? "Failed to initialize Stripe")
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message ?? "Stripe initialization error")
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  if (!stripeKey) {
    return <p className="text-sm text-red-500">{"Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"}</p>
  }

  if (!stripePromise) {
    return <Skeleton className="h-28 w-full" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"Pay with Link / Card"}</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : !clientSecret ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: "stripe" },
            }}
          >
            <CheckoutForm />
          </Elements>
        )}
      </CardContent>
    </Card>
  )
}

export { StripeCheckout }
