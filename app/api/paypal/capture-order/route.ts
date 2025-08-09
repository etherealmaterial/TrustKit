import type { NextRequest } from "next/server"
import { getAccessToken } from "../_helpers"

export async function POST(req: NextRequest) {
  try {
    const { orderID } = (await req.json()) as { orderID: string }
    if (!orderID) return new Response(JSON.stringify({ error: "orderID required" }), { status: 400 })

    const { token, base } = await getAccessToken()
    const res = await fetch(`${base}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error(`PayPal capture failed: ${res.status} ${t}`)
    }
    const data = await res.json()
    const captureId = data?.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null
    return Response.json({ id: captureId, status: data?.status ?? "COMPLETED" })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "PayPal error" }), { status: 500 })
  }
}
