import { NextResponse } from "next/server"
import { fetchEthUsd, toCents } from "@/lib/prices"

export async function GET() {
  try {
    const price = await fetchEthUsd()
    return NextResponse.json({
      ok: true,
      priceUsd: price.usd,
      amountUsdCents: toCents(price.usd),
      source: price.source,
      asOf: price.asOf,
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Failed to fetch ETH price" }, { status: 500 })
  }
}
