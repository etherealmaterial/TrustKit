import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function BuyEthSuccessPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const pi = typeof searchParams?.pi === "string" ? searchParams?.pi : undefined
  const po = typeof searchParams?.paypal_order === "string" ? searchParams?.paypal_order : undefined

  return (
    <main className="container mx-auto max-w-xl px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Payment received</CardTitle>
          <CardDescription>Thanks! We’ll process your 1 ETH order shortly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {pi ? (
            <p className="text-sm">
              Stripe PaymentIntent: <span className="font-mono">{pi}</span>
            </p>
          ) : null}
          {po ? (
            <p className="text-sm">
              PayPal Order: <span className="font-mono">{po}</span>
            </p>
          ) : null}
          {!pi && !po ? <p className="text-sm">Success</p> : null}
          <div className="pt-4">
            <Link href="/buy-eth">
              <Button variant="outline">Back to Buy 1 ETH</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
