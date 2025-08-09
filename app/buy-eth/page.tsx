import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchEthUsdPrice } from "@/lib/prices"
import StripeSection from "@/components/stripe-section"
import PayPalSection from "@/components/paypal-section"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

export default async function BuyEthPage() {
  const price = await fetchEthUsdPrice()

  return (
    <main className="container mx-auto max-w-3xl px-6 py-10">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold">Buy 1 ETH</h1>
        <p className="text-muted-foreground">
          Live price fetched server-side. Choose Link/Card (Stripe) or PayPal to pay the USD equivalent.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Price</CardTitle>
          <CardDescription>ETH price in USD (from CoinGecko)</CardDescription>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          {"$"}
          {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          {" USD"}
        </CardContent>
      </Card>

      <Tabs defaultValue="stripe" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="stripe">Link / Card (Stripe)</TabsTrigger>
          <TabsTrigger value="paypal">PayPal</TabsTrigger>
        </TabsList>

        <TabsContent value="stripe" className="mt-4">
          <Suspense fallback={<Skeleton className="h-36 w-full" />}>
            <StripeSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="paypal" className="mt-4">
          <Suspense fallback={<Skeleton className="h-36 w-full" />}>
            <PayPalSection />
          </Suspense>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground mt-6">
        This example processes a fiat payment for the USD value of 1 ETH. Delivery of ETH to a wallet is not included
        and requires additional on-ramp/exchange integration and compliance checks.
      </p>
    </main>
  )
}
