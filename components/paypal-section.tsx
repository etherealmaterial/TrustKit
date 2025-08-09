"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

const PayPalCheckout = dynamic(() => import("./paypal-checkout"), {
  ssr: false,
  loading: () => <Skeleton className="h-36 w-full" />,
})

export default function PayPalSection() {
  return <PayPalCheckout />
}
