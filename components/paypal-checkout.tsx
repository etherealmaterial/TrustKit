"use client"

import { Suspense, useMemo, useState } from "react"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

export default function PayPalCheckout() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""
  const [status, setStatus] = useState<"idle" | "processing" | "succeeded" | "failed">("idle")
  const [error, setError] = useState<string | null>(null)

  const options = useMemo(
    () => ({
      "client-id": clientId,
      currency: "USD",
      intent: "CAPTURE",
    }),
    [clientId],
  )

  if (!clientId) {
    return (
      <Alert variant="destructive">
        <AlertTitle>PayPal not configured</AlertTitle>
        <AlertDescription>Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID.</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pay with PayPal</CardTitle>
        <CardDescription>Checkout using your PayPal account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="h-24 w-full" />}>
          <PayPalScriptProvider options={options}>
            <div className="space-y-4">
              <PayPalButtons
                style={{ layout: "vertical", shape: "rect", label: "paypal" }}
                createOrder={async () => {
                  setStatus("processing")
                  setError(null)
                  const res = await fetch("/api/paypal/create-order", { method: "POST" })
                  const data = await res.json()
                  if (!res.ok) {
                    setStatus("failed")
                    setError(data?.error || "Failed to create PayPal order")
                    throw new Error(data?.error || "Create order failed")
                  }
                  return data.id
                }}
                onApprove={async (data) => {
                  try {
                    const res = await fetch("/api/paypal/capture-order", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ orderID: data.orderID }),
                    })
                    const json = await res.json()
                    if (!res.ok || !json?.success) {
                      setStatus("failed")
                      setError(json?.error || "Capture failed")
                      return
                    }
                    setStatus("succeeded")
                  } catch (e: any) {
                    setStatus("failed")
                    setError(e?.message || "Capture failed")
                  }
                }}
                onError={(err) => {
                  setStatus("failed")
                  setError(err instanceof Error ? err.message : "PayPal error")
                }}
                onCancel={() => {
                  setStatus("idle")
                }}
                forceReRender={[options.currency]}
              />

              {status === "succeeded" && (
                <Alert>
                  <AlertTitle>Payment successful</AlertTitle>
                  <AlertDescription>
                    Your PayPal payment for 1 ETH was processed. Note: Asset delivery is not automated in this demo.
                  </AlertDescription>
                </Alert>
              )}

              {status === "failed" && error && (
                <Alert variant="destructive">
                  <AlertTitle>Payment error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </PayPalScriptProvider>
        </Suspense>
      </CardContent>
    </Card>
  )
}
