"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CreditCard, Wallet } from "lucide-react"

declare global {
  interface Window {
    paypal?: any
  }
}

type Props = {
  defaultAmount?: number
  buyerCountry?: string
  currency?: string
  enableFunding?: string
  clientIdFallback?: string
}

export default function PaypalAdvancedCheckout({
  defaultAmount = 100,
  buyerCountry = "US",
  currency = "USD",
  enableFunding = "venmo,card",
  clientIdFallback = "test",
}: Props) {
  const [amount, setAmount] = useState<number>(defaultAmount)
  const [sdkReady, setSdkReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cardFieldsRef = useRef<any>(null)

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || clientIdFallback

  useEffect(() => {
    if (!sdkReady || !window.paypal) return

    // Render PayPal Buttons
    try {
      window.paypal
        .Buttons({
          style: { layout: "vertical", shape: "rect", color: "gold", label: "pay" },
          createOrder: async () => {
            const id = await createOrderOnServer(amount)
            return id
          },
          onApprove: async (data: { orderID: string }) => {
            await captureOnServer(data.orderID)
          },
          onError: (err: any) => {
            console.error(err)
            setError("PayPal Buttons error")
          },
        })
        .render("#paypal-button-container")
    } catch (e) {
      console.warn("Buttons render skipped:", e)
    }

    // Render Advanced Card Fields if eligible
    try {
      if (window.paypal.CardFields?.isEligible?.()) {
        window.paypal
          .CardFields({
            // Map fields to containers
            fields: {
              number: { selector: "#card-number-field-container" },
              cvv: { selector: "#card-cvv-field-container" },
              expiry: { selector: "#card-expiry-field-container" },
              name: { selector: "#card-name-field-container" },
            },
          })
          .then((cardFields: any) => {
            cardFieldsRef.current = cardFields
            const btn = document.getElementById("card-field-submit-button")
            if (btn) {
              btn.addEventListener("click", async () => {
                setProcessing(true)
                setError(null)
                setMessage(null)
                try {
                  const orderId = await createOrderOnServer(amount)
                  const billingAddress = {
                    addressLine1:
                      (document.getElementById("card-billing-address-line-1") as HTMLInputElement)?.value || "",
                    addressLine2:
                      (document.getElementById("card-billing-address-line-2") as HTMLInputElement)?.value || "",
                    adminArea1:
                      (document.getElementById("card-billing-address-admin-area-line-1") as HTMLInputElement)?.value ||
                      "",
                    adminArea2:
                      (document.getElementById("card-billing-address-admin-area-line-2") as HTMLInputElement)?.value ||
                      "",
                    postalCode:
                      (document.getElementById("card-billing-address-postal-code") as HTMLInputElement)?.value || "",
                    countryCode:
                      (document.getElementById("card-billing-address-country-code") as HTMLInputElement)?.value || "",
                  }
                  await cardFields.submit({
                    contingencies: ["3D_SECURE"],
                    cardholderName:
                      (document.getElementById("card-name-field-container")?.querySelector("input") as HTMLInputElement)
                        ?.value || "",
                    billingAddress,
                    orderId,
                  })
                  await captureOnServer(orderId)
                } catch (err: any) {
                  console.error(err)
                  setError("Card payment failed")
                } finally {
                  setProcessing(false)
                }
              })
            }
          })
          .catch((err: any) => {
            console.warn("CardFields init failed:", err)
          })
      } else if (window.paypal.HostedFields?.isEligible?.()) {
        // Fallback to Hosted Fields if CardFields not available
        window.paypal.HostedFields.render({
          styles: { input: { "font-size": "16px" } },
          fields: {
            number: { selector: "#card-number-field-container" },
            cvv: { selector: "#card-cvv-field-container" },
            expirationDate: { selector: "#card-expiry-field-container" },
          },
          createOrder: async () => {
            const id = await createOrderOnServer(amount)
            return id
          },
        })
          .then((hf: any) => {
            cardFieldsRef.current = hf
            const btn = document.getElementById("card-field-submit-button")
            if (btn) {
              btn.addEventListener("click", async () => {
                setProcessing(true)
                setError(null)
                setMessage(null)
                try {
                  const payload = await hf.submit({ contingencies: ["3D_SECURE"] })
                  await captureOnServer(payload?.orderId)
                } catch (err: any) {
                  console.error(err)
                  setError("Card payment failed")
                } finally {
                  setProcessing(false)
                }
              })
            }
          })
          .catch((err: any) => {
            console.warn("HostedFields init failed:", err)
          })
      }
    } catch (e) {
      console.warn("Card init skipped:", e)
    }
  }, [sdkReady, amount])

  async function createOrderOnServer(amt: number) {
    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amt }),
    })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || "Create order failed")
    return json.id as string
  }

  async function captureOnServer(orderId: string) {
    const res = await fetch("/api/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || "Capture failed")
    setMessage("Payment captured successfully. Your account has been credited.")
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          {"Step 1: Credit your account"}
        </CardTitle>
        <CardDescription>
          {"Add USD funds to your account using PayPal or your card. This balance will be used to purchase crypto."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="amount" className="block text-sm font-medium">
              {"Amount (USD)"}
            </label>
            <Input
              id="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              placeholder="100.00"
            />
          </div>
          <Button variant="outline" onClick={() => setAmount(100)}>
            {"Quick $100"}
          </Button>
          <Button variant="outline" onClick={() => setAmount(500)}>
            {"Quick $500"}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div id="paypal-button-container" className="paypal-button-container" />
          </div>

          <div id="card-form" className="space-y-3">
            <div id="card-name-field-container" />
            <div id="card-number-field-container" />
            <div className="grid grid-cols-2 gap-3">
              <div id="card-expiry-field-container" />
              <div id="card-cvv-field-container" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input id="card-billing-address-line-1" placeholder="Address line 1" />
              <Input id="card-billing-address-line-2" placeholder="Address line 2" />
              <Input id="card-billing-address-admin-area-line-1" placeholder="Admin area line 1" />
              <Input id="card-billing-address-admin-area-line-2" placeholder="Admin area line 2" />
              <Input id="card-billing-address-country-code" placeholder="Country code (e.g., US)" />
              <Input id="card-billing-address-postal-code" placeholder="Postal/zip code" />
            </div>

            <Button id="card-field-submit-button" type="button" disabled={processing} className="w-full">
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {"Processing..."}
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {"Pay now with Card"}
                </>
              )}
            </Button>
          </div>
        </div>

        {message && (
          <Alert className="border-green-600/40">
            <AlertTitle>{"Success"}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>{"Error"}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&buyer-country=${encodeURIComponent(buyerCountry)}&currency=${encodeURIComponent(currency)}&components=buttons,card-fields&enable-funding=${encodeURIComponent(enableFunding)}`}
          strategy="afterInteractive"
          data-sdk-integration-source="developer-studio"
          onLoad={() => setSdkReady(true)}
          onError={() => setError("Failed to load PayPal SDK")}
        />
      </CardContent>
    </Card>
  )
}
