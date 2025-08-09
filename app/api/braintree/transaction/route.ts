import { NextResponse } from "next/server"
import { getBraintreeGateway, type BraintreeTransactionResult } from "../_gateway"

type Body = {
  amount: number | string
  nonce: string
  deviceData?: string
}

export async function POST(req: Request) {
  try {
    const { amount, nonce, deviceData } = (await req.json()) as Body

    const normalizedAmount = typeof amount === "string" ? amount.trim() : String(amount)
    const amtNum = Number(normalizedAmount)
    if (!Number.isFinite(amtNum) || amtNum < 1) {
      return NextResponse.json({ ok: false, error: "Invalid amount. Minimum is $1.00" }, { status: 400 })
    }
    if (!nonce || typeof nonce !== "string") {
      return NextResponse.json({ ok: false, error: "Missing payment method nonce" }, { status: 400 })
    }

    const gateway = getBraintreeGateway()
    const saleResult = await gateway.transaction.sale({
      amount: (Math.round(amtNum * 100) / 100).toFixed(2),
      paymentMethodNonce: nonce,
      deviceData,
      options: {
        submitForSettlement: true,
      },
    })

    const payload: BraintreeTransactionResult = {
      success: saleResult.success === true,
      transactionId: saleResult.transaction?.id,
      status: saleResult.transaction?.status,
      message: saleResult.message,
      processorResponseText: saleResult.transaction?.processorResponseText,
      processorResponseCode: saleResult.transaction?.processorResponseCode,
    }

    if (!saleResult.success) {
      return NextResponse.json({ ok: false, result: payload }, { status: 400 })
    }

    return NextResponse.json({ ok: true, result: payload })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Transaction failed" }, { status: 500 })
  }
}
