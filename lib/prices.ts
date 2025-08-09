export async function fetchEthUsdPrice(): Promise<number> {
  // Fetch price from a public API; disable caching to keep it fresh.
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error(`Failed to fetch ETH price: ${res.status}`)
  }
  const data = (await res.json()) as { ethereum?: { usd?: number } }
  const price = data?.ethereum?.usd
  if (!price || !Number.isFinite(price)) {
    throw new Error("Invalid ETH price data")
  }
  return price
}

export function toUsdCents(usd: number): number {
  // Convert to cents safely and clamp to minimum $1 to satisfy payment processor minimums
  const cents = Math.round(usd * 100)
  return Math.max(cents, 100)
}
