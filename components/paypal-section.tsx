"use client"

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js"
import { useCallback, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""

export default function PayPalSection() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const options = useMemo(
    () => ({
      "client-id": clientId,
      components: "buttons",
      currency: "USD",
      intent: "capture",
      commit: true,
      // Prevent PayPal from auto-guessing based on page locale
      "disable-funding": "credit,card",
    }),
    [],
  )

  const createOrder = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/paypal/create-order", { method: "POST" })
      const json = await res.json()
      if (!res.ok || !json?.ok || !json?.id) {
        throw new Error(json?.error || "Failed to create PayPal order")
      }
      return json.id as string
    } catch (err: any) {
      setError(err?.message ?? "Create order failed")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const onApprove = useCallback(async (data: any) => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID: data.orderID }),
      })
      const json = await res.json()
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Capture failed")
      }
      window.location.href = `/buy-eth/success?paypal_order=${encodeURIComponent(data.orderID)}`
    } catch (err: any) {
      setError(err?.message ?? "Capture failed")
    } finally {
      setLoading(false)
    }
  }, [])

  if (!clientId) {
    return <p className="text-sm text-destructive">Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID</p>
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading ? <p className="text-sm text-muted-foreground">Processing...</p> : null}
        <PayPalScriptProvider options={options}>
          <PayPalButtons
            fundingSource={undefined}
            style={{ layout: "vertical", shape: "rect", label: "paypal" }}
            createOrder={createOrder}
            onApprove={onApprove}
          />
        </PayPalScriptProvider>
      </CardContent>
    </Card>
  )
}
