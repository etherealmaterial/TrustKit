import dynamic from "next/dynamic"
import { Suspense } from "react"
import { fetchEthUsd, formatUSD } from "@/lib/prices"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

const StripeSection = dynamic(() => import("@/components/stripe-section"), { ssr: false })
const PayPalSection = dynamic(() => import("@/components/paypal-section"), { ssr: false })

export default async function BuyEthPage() {
  const price = await fetchEthUsd()

  return (
    <main className="container mx-auto max-w-3xl px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Buy 1 ETH</CardTitle>
          <CardDescription>
            Price as of {price.asOf} via {price.source}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-lg">
            <span className="text-muted-foreground">Amount:</span> <span className="font-semibold">1.0000 ETH</span>
          </div>
          <div className="text-lg">
            <span className="text-muted-foreground">Total:</span>{" "}
            <span className="font-semibold">{formatUSD(price.usd)}</span>
          </div>

          <Separator />

          <Tabs defaultValue="stripe">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="stripe">Link / Card (Stripe)</TabsTrigger>
              <TabsTrigger value="paypal">PayPal</TabsTrigger>
            </TabsList>

            <TabsContent value="stripe" className="mt-4">
              <Suspense fallback={<div className="text-sm text-muted-foreground">Loading Stripe checkout…</div>}>
                {/* Client-only Stripe checkout */}
                <StripeSection />
              </Suspense>
            </TabsContent>

            <TabsContent value="paypal" className="mt-4">
              <Suspense fallback={<div className="text-sm text-muted-foreground">Loading PayPal…</div>}>
                {/* Client-only PayPal checkout */}
                <PayPalSection />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
}
