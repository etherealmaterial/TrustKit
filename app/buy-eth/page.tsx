import dynamic from "next/dynamic"
import { fetchEthUsd } from "@/lib/prices"
import BuyEthClient from "@/components/buy-eth-client"

const StripeSection = dynamic(() => import("@/components/stripe-section"), { ssr: false })
const PayPalSection = dynamic(() => import("@/components/paypal-section"), { ssr: false })

export default async function BuyEthPage() {
  const price = await fetchEthUsd()

  return (
    <main className="container mx-auto max-w-3xl px-6 py-10">
      <BuyEthClient priceUsd={price.usd} asOf={price.asOf} source={price.source} />
    </main>
  )
}
