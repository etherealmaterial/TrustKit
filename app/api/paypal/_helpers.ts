const ENV = (process.env.PAYPAL_ENV || "sandbox").toLowerCase()
const BASE = ENV === "live" ? "https://api.paypal.com" : "https://api-m.sandbox.paypal.com"

export async function getAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_SECRET
  if (!clientId || !secret) {
    throw new Error("PayPal env vars missing")
  }
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64")
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`PayPal token error: ${res.status}`)
  const data = (await res.json()) as { access_token: string }
  return { token: data.access_token, base: BASE }
}
