import { NextResponse } from "next/server"
import { createOrder } from "../_helpers"

export async function POST(req: Request) {
  const { amount } = await req.json().catch(() => ({}))
  const val = Number(amount)
  if (!Number.isFinite(val) || val <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid amount" }, { status: 400 })
  }
  try {
    const order = await createOrder(val.toFixed(2))
    return NextResponse.json({ ok: true, id: order.id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Create order failed" }, { status: 500 })
  }
}
