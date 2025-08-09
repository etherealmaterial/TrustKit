"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamically load the Stripe checkout on the client only to avoid SSR suspensions.
const StripeCheckout = dynamic(() => import("./stripe-checkout"), {
  ssr: false,
  loading: () => <Skeleton className="h-36 w-full" />,
})

export default function StripeSection() {
  return <StripeCheckout />
}
