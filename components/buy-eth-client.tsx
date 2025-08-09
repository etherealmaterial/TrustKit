"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { formatUSD } from "@/lib/prices"

const StripeSection = dynamic(() => import("@/components/stripe-section"), { ssr: false })
const PayPalSection = dynamic(() => import("@/components/paypal-section"), { ssr: false })

export type BuyEthClientProps = {
  priceUsd: number
  asOf: string
  source: string
}

export default function BuyEthClient({ priceUsd, asOf, source }: BuyEthClientProps) {
  // amount is 1 ETH in USD at current price
  const totalUsd = priceUsd

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Buy 1 ETH</CardTitle>
        <CardDescription>{`Price as of ${asOf} via ${source}`}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-lg">
          <span className="text-muted-foreground">Amount:</span> <span className="font-semibold">1.0000 ETH</span>
        </div>
        <div className="text-lg">
          <span className="text-muted-foreground">Total:</span>{" "}
          <span className="font-semibold">{formatUSD(totalUsd)}</span>
        </div>

        <Separator />

        <Tabs defaultValue="stripe">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="stripe">Link / Card (Stripe)</TabsTrigger>
            <TabsTrigger value="paypal">PayPal</TabsTrigger>
          </TabsList>

          <TabsContent value="stripe" className="mt-4">
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading Stripe checkout…</div>}>
              <StripeSection amountUsd={totalUsd} />
            </Suspense>
          </TabsContent>

          <TabsContent value="paypal" className="mt-4">
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading PayPal…</div>}>
              <PayPalSection amountUsd={totalUsd} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
