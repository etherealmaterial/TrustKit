import { NextResponse } from "next/server"
import { captureOrder } from "../_helpers"

export async function POST(req: Request) {
  const { orderId } = await req.json().catch(() => ({}))
  if (!orderId) return NextResponse.json({ ok: false, error: "orderId required" }, { status: 400 })
  try {
    const result = await captureOrder(String(orderId))
    return NextResponse.json({ ok: true, result })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Capture failed" }, { status: 500 })
  }
}
