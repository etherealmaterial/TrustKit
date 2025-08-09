"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

declare global {
  interface Window {
    braintree?: any
  }
}

async function loadBraintreeScript() {
  if (typeof window === "undefined") return
  if (window.braintree?.dropin) return
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      'script[src*="braintreegateway.com/web/dropin"]',
    ) as HTMLScriptElement | null
    if (existing && (window as any).braintree?.dropin) {
      resolve()
      return
    }
    const s = document.createElement("script")
    s.src = "https://js.braintreegateway.com/web/dropin/1.45.1/js/dropin.min.js"
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Failed to load Braintree Drop-in script"))
    document.head.appendChild(s)
  })
}

export default function BraintreeDropIn() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const instanceRef = useRef<any>(null)

  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState<string>("100.00")
  const [resultMsg, setResultMsg] = useState<string | null>(null)
  const [txId, setTxId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function init() {
      try {
        setLoading(true)
        setError(null)
        setResultMsg(null)
        setTxId(null)

        await loadBraintreeScript()

        const tokenRes = await fetch("/api/braintree/token", { cache: "no-store" })
        const tokenJson = await tokenRes.json()
        if (!tokenRes.ok || !tokenJson?.ok || !tokenJson?.token) {
          throw new Error(tokenJson?.error || "Failed to get client token")
        }

        if (!active) return
        setInitializing(true)

        if (!containerRef.current) return
        // Clear previous instance if navigating within the page
        containerRef.current.innerHTML = ""

        await new Promise<void>((resolve, reject) => {
          window.braintree.dropin.create(
            {
              authorization: tokenJson.token as string,
              container: containerRef.current!,
              // You can enable additional payment options configured in your Braintree account:
              // paypal: { flow: "vault" },
              card: {
                cardholderName: true,
                overrides: {
                  fields: {
                    postalCode: { placeholder: "ZIP" },
                  },
                },
              },
              // dataCollector: { kount: true }, // if Kount is enabled on your merchant account
            },
            (err: any, instance: any) => {
              if (err) {
                reject(err)
                return
              }
              instanceRef.current = instance
              resolve()
            },
          )
        })
      } catch (e: any) {
        if (active) setError(e?.message || "Initialization failed")
      } finally {
        if (active) {
          setInitializing(false)
          setLoading(false)
        }
      }
    }
    void init()
    return () => {
      active = false
      // Teardown instance to prevent leaks when unmounting
      if (instanceRef.current) {
        instanceRef.current.teardown?.()
        instanceRef.current = null
      }
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResultMsg(null)
    setTxId(null)
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt < 1) {
      setError("Enter a valid amount (minimum $1.00)")
      return
    }
    const instance = instanceRef.current
    if (!instance) {
      setError("Payment form not ready")
      return
    }

    try {
      setInitializing(true)
      const payload = await new Promise<{ nonce: string }>((resolve, reject) => {
        instance.requestPaymentMethod((err: any, payload: any) => {
          if (err) {
            reject(err)
            return
          }
          resolve({ nonce: payload.nonce })
        })
      })

      const resp = await fetch("/api/braintree/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, nonce: payload.nonce }),
      })
      const json = await resp.json()
      if (!resp.ok || !json?.ok) {
        const msg =
          json?.result?.message ||
          json?.error ||
          json?.result?.processorResponseText ||
          "Transaction declined. Please try another payment method."
        setError(String(msg))
        return
      }

      setTxId(json?.result?.transactionId || null)
      setResultMsg("Funds credited successfully.")
    } catch (e: any) {
      setError(e?.message || "Payment failed")
    } finally {
      setInitializing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit your account</CardTitle>
        <CardDescription>Add USD funds via card to purchase crypto.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="1"
              placeholder="100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="border rounded-md p-3">
            {/* The Drop-in UI mounts here */}
            <div ref={containerRef} id="dropin-container" />
          </div>

          <Button type="submit" disabled={loading || initializing} className="w-full">
            {loading || initializing ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {loading ? "Loading payment…" : "Processing…"}
              </span>
            ) : (
              "Add Funds"
            )}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Payment error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {resultMsg && (
          <Alert>
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              {resultMsg}
              {txId ? (
                <>
                  {" "}
                  Transaction ID: <span className="font-mono">{txId}</span>
                </>
              ) : null}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
