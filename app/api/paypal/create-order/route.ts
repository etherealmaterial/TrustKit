import { NextResponse } from "next/server"
import { fetchEthUsdPrice } from "@/lib/prices"

function getPaypalBaseUrl() {
  const env = (process.env.PAYPAL_ENV || "sandbox").toLowerCase()
  return env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"
}

async function getAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_SECRET
  if (!clientId || !secret) {
    throw new Error("Missing PayPal credentials")
  }
  const base = getPaypalBaseUrl()
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${clientId}:${secret}`),
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PayPal token error: ${res.status} ${text}`)
  }
  const data = (await res.json()) as { access_token?: string }
  if (!data.access_token) throw new Error("No PayPal access token returned")
  return data.access_token
}

export async function POST() {
  try {
    const usd = await fetchEthUsdPrice()
    const value = Math.max(1, Math.round(usd * 100) / 100) // round to 2dp min $1

    const accessToken = await getAccessToken()
    const base = getPaypalBaseUrl()

    const res = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: "Buy 1 ETH (fiat payment only)",
            amount: {
              currency_code: "USD",
              value: value.toFixed(2),
            },
          },
        ],
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: json?.message || "PayPal order error" }, { status: 500 })
    }
    return NextResponse.json({ id: json.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "PayPal order creation failed" }, { status: 500 })
  }
}
