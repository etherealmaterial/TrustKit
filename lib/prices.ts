export type EthPrice = {
  usd: number
  asOf: string
  source: string
}

// Fetch ETH price (USD) from CoinGecko with no caching to avoid stale totals
export async function fetchEthUsd(): Promise<EthPrice> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd", {
      cache: "no-store",
      headers: { accept: "application/json" },
    })
    if (!res.ok) throw new Error(`Price fetch failed: ${res.status}`)
    const data = (await res.json()) as { ethereum?: { usd?: number } }
    const usd = Number(data?.ethereum?.usd ?? 0)
    return {
      usd,
      asOf: new Date().toISOString(),
      source: "CoinGecko",
    }
  } catch (e) {
    // Fallback to 0 to avoid breaking the page, but call out unavailability
    return {
      usd: 0,
      asOf: new Date().toISOString(),
      source: "Unavailable",
    }
  }
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount)
}
