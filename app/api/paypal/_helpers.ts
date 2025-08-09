const isLive = (process.env.PAYPAL_ENV || "").toLowerCase() === "live"
const BASE = isLive ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

function getCreds() {
  const client =
    process.env.NEXT_SECRET_PAYPAL_CLIENT_ID ||
    process.env.NEXT_PAYPAL_CLIENT_ID ||
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_SECRET || process.env.NEXT_SECRET_PAYPAL_CLIENT_ID
  if (!client || !secret) {
    throw new Error("PayPal credentials missing")
  }
  return { client, secret }
}

export async function getAccessToken() {
  const { client, secret } = getCreds()
  const auth = Buffer.from(`${client}:${secret}`).toString("base64")
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`PayPal token error: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { access_token: string }
  return json.access_token
}

export async function createOrder(amountUSD: string) {
  const token = await getAccessToken()
  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ amount: { value: amountUSD, currency_code: "USD" } }],
    }),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`PayPal create order error: ${res.status} ${await res.text()}`)
  return (await res.json()) as { id: string }
}

export async function captureOrder(orderId: string) {
  const token = await getAccessToken()
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`PayPal capture error: ${res.status} ${await res.text()}`)
  return (await res.json()) as unknown
}
