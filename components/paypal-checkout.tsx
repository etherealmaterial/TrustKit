"use client"

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useMemo, useState } from "react"

export default function PayPalCheckout() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const initialOptions = useMemo(
    () => ({
      clientId: clientId ?? "",
      currency: "USD",
      intent: "capture" as const,
    }),
    [clientId],
  )
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  if (!clientId) {
    return <p className="text-sm text-red-500">{"Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID"}</p>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"Pay with PayPal"}</CardTitle>
      </CardHeader>
      <CardContent>
        <PayPalScriptProvider options={initialOptions}>
          <PayPalButtons
            style={{ layout: "vertical" }}
            createOrder={async () => {
              setStatusMsg(null)
              const res = await fetch("/api/paypal/create-order", { method: "POST" })
              const json = (await res.json()) as { ok: boolean; orderID?: string; error?: string }
              if (!json.ok || !json.orderID) {
                setStatusMsg(json.error ?? "Failed to create PayPal order")
                throw new Error(json.error ?? "create-order failed")
              }
              return json.orderID
            }}
            onApprove={async (data) => {
              const res = await fetch("/api/paypal/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderID: data.orderID }),
              })
              const json = (await res.json()) as { ok: boolean; error?: string }
              if (!json.ok) setStatusMsg(json.error ?? "Capture failed")
              else setStatusMsg("Payment captured")
            }}
          />
          {!statusMsg ? <Skeleton className="h-4 w-32 mt-3" /> : <p className="text-sm">{statusMsg}</p>}
        </PayPalScriptProvider>
      </CardContent>
    </Card>
  )
}

export { PayPalCheckout }
