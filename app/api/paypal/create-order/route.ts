import type { NextRequest } from "next/server"
import { getAccessToken } from "../_helpers"

export async function POST(req: NextRequest) {
  try {
    const { amount } = (await req.json()) as { amount: number }
    const normalized = Math.max(1, Math.round((Number(amount) || 0) * 100) / 100) // min $1.00
    const { token, base } = await getAccessToken()
    const res = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "USD", value: normalized.toFixed(2) },
            description: "Buy 1 ETH",
          },
        ],
      }),
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error(`PayPal create order failed: ${res.status} ${t}`)
    }
    const data = await res.json()
    return Response.json({ id: data.id })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "PayPal error" }), { status: 500 })
  }
}
