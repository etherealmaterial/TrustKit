"use client"

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"

type Props = { amountUsd: number }

export default function PayPalSection({ amountUsd }: Props) {
  const [status, setStatus] = useState<string | null>(null)
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""
  const options = useMemo(
    () => ({
      "client-id": clientId,
      currency: "USD",
      intent: "CAPTURE",
      components: "buttons",
      "enable-funding": "venmo",
    }),
    [clientId],
  )

  if (!clientId) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-600">Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID</p>
        <Button asChild>
          <a href="https://developer.paypal.com/dashboard/" target="_blank" rel="noreferrer">
            Get PayPal Client ID
          </a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PayPalScriptProvider options={options}>
        <PayPalButtons
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
          createOrder={async () => {
            setStatus("Creating PayPal order…")
            const res = await fetch("/api/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount: Math.max(1, Math.round(amountUsd * 100) / 100) }),
            })
            if (!res.ok) throw new Error(await res.text())
            const data = (await res.json()) as { id: string }
            return data.id
          }}
          onApprove={async (data) => {
            setStatus("Capturing PayPal payment…")
            const res = await fetch("/api/paypal/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderID: data.orderID }),
            })
            if (!res.ok) throw new Error(await res.text())
            const capture = await res.json()
            setStatus(`Payment complete. Capture ID: ${capture?.id ?? "N/A"}`)
          }}
          onError={(err) => {
            console.error(err)
            setStatus("PayPal error occurred. See console.")
          }}
        />
      </PayPalScriptProvider>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </div>
  )
}
