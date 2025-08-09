import { NextResponse } from "next/server"
import { fetchEthUsdPrice } from "@/lib/prices"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const price = await fetchEthUsdPrice()
    return NextResponse.json({ symbol: "ETH", currency: "USD", price })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Price error" }, { status: 500 })
  }
}
