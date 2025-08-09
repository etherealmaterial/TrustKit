"use client"

import type React from "react"
import { Suspense, useEffect, useMemo, useState } from "react"
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""

// Initialize the Stripe promise outside render, per Stripe docs.
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()
  const [status, setStatus] = useState<"idle" | "processing" | "succeeded" | "failed">("idle")
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setStatus("processing")
    setError(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: "if_required",
    })

    if (error) {
      setStatus("failed")
      setError(error.message || "Payment failed")
      return
    }

    if (paymentIntent?.status === "succeeded") {
      setStatus("succeeded")
    } else {
      setStatus("processing")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={!stripe || status === "processing"}>
          {status === "processing" ? "Processing..." : "Pay with Link/Card"}
        </Button>
      </div>

      {status === "succeeded" && (
        <Alert>
          <AlertTitle>Payment successful</AlertTitle>
          <AlertDescription>
            Your payment for 1 ETH was processed. Note: Asset delivery is not automated in this demo.
          </AlertDescription>
        </Alert>
      )}

      {status === "failed" && error && (
        <Alert variant="destructive">
          <AlertTitle>Payment failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </form>
  )
}

export default function StripeCheckout() {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch("/api/stripe/create-payment-intent", { method: "POST" })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to initialize payment")
        if (mounted) setClientSecret(data.clientSecret)
      } catch (err: any) {
        if (mounted) setError(err?.message || "Initialization error")
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const options = useMemo<StripeElementsOptions | undefined>(() => {
    if (!clientSecret) return undefined
    return {
      clientSecret,
      appearance: { theme: "stripe" },
    }
  }, [clientSecret])

  if (!publishableKey) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Stripe not configured</AlertTitle>
        <AlertDescription>Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.</AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Initialization error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!stripePromise || !options) {
    return <Skeleton className="h-24 w-full" />
  }

  // Wrap the SDK in Suspense to avoid "uncached promise" if the provider suspends while mounting.
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pay with Link/Card (Stripe)</CardTitle>
        <CardDescription>Use Link or a card via Stripe Payment Element.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="h-24 w-full" />}>
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm />
          </Elements>
        </Suspense>
      </CardContent>
    </Card>
  )
}
