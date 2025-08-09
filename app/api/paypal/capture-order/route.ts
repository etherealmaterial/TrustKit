import { NextResponse } from "next/server"

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

export async function POST(req: Request) {
  try {
    const { orderID } = (await req.json()) as { orderID?: string }
    if (!orderID) {
      return NextResponse.json({ error: "Missing orderID" }, { status: 400 })
    }
    const token = await getAccessToken()
    const base = getPaypalBaseUrl()
    const res = await fetch(`${base}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
    const json = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: json?.message || "Capture error" }, { status: 500 })
    }
    return NextResponse.json({ success: true, details: json })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "PayPal capture failed" }, { status: 500 })
  }
}
