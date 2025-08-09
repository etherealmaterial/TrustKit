export type EthPrice = {
  usd: number
  source: "coinbase" | "coingecko" | "fallback"
  asOf: string
}

// Fetch ETH price in USD from public APIs (server-side).
// Tries Coinbase, then CoinGecko, then a static fallback.
export async function fetchEthUsd(): Promise<EthPrice> {
  // Prefer Coinbase (no auth).
  try {
    const res = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot", {
      // Avoid caching stale price
      cache: "no-store",
      headers: { "User-Agent": "arcadiaxchange/1.0" },
    })
    if (res.ok) {
      const json = (await res.json()) as any
      const amount = Number(json?.data?.amount)
      if (Number.isFinite(amount) && amount > 0) {
        return { usd: amount, source: "coinbase", asOf: new Date().toISOString() }
      }
    }
  } catch {
    // ignore and try next
  }

  // Fallback to CoinGecko
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd", {
      cache: "no-store",
      headers: { "User-Agent": "arcadiaxchange/1.0" },
    })
    if (res.ok) {
      const json = (await res.json()) as any
      const amount = Number(json?.ethereum?.usd)
      if (Number.isFinite(amount) && amount > 0) {
        return { usd: amount, source: "coingecko", asOf: new Date().toISOString() }
      }
    }
  } catch {
    // ignore and use final fallback
  }

  // Static fallback if APIs fail
  return { usd: 3000, source: "fallback", asOf: new Date().toISOString() }
}

// Convert a USD price to a Stripe integer amount of cents
export function toCents(usd: number): number {
  return Math.round(usd * 100)
}

// Format USD price for display
export function formatUSD(usd: number): string {
  return usd.toLocaleString("en-US", { style: "currency", currency: "USD" })
}
