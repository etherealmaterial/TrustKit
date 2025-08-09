import { NextResponse } from "next/server"
import { getBraintreeGateway } from "../_gateway"

export async function GET() {
  try {
    const gateway = getBraintreeGateway()
    const result = await gateway.clientToken.generate({})
    return NextResponse.json({ ok: true, token: result.clientToken })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Failed to generate client token" }, { status: 500 })
  }
}
