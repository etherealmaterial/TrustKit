import PaypalAdvancedCheckout from "@/components/paypal-advanced-checkout"
import { Card, CardContent } from "@/components/ui/card"

export default function CreditAccountPage() {
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <section className="rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-6">
        <h1 className="text-2xl font-semibold">{"Welcome to Arcadia Xchange"}</h1>
        <p className="text-muted-foreground mt-2">
          {
            "First step: credit your account. Once funds are available, you can purchase crypto (e.g., 1 ETH) instantly."
          }
        </p>
      </section>
      <PaypalAdvancedCheckout
        defaultAmount={100}
        clientIdFallback="AQ9E6FCmuZX7OMfgprCyqCQmZPcrEkeapO1wHY3ZHkonZ8Sf5kN3W0h9D7AX634I9jjPKW7C_PW5FDIO"
      />
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          {"Note: This demo credits fiat only. On-chain transfers can be automated via webhooks after capture."}
        </CardContent>
      </Card>
    </main>
  )
}
