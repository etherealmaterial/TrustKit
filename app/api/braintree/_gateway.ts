import braintree from "braintree"

function getEnv() {
  const raw = (process.env.BRAINTREE_ENV || "sandbox").toLowerCase()
  return raw === "production" ? braintree.Environment.Production : braintree.Environment.Sandbox
}

export function getBraintreeGateway() {
  const merchantId = process.env.BRAINTREE_MERCHANT_ID
  const publicKey = process.env.BRAINTREE_PUBLIC_KEY
  const privateKey = process.env.BRAINTREE_PRIVATE_KEY

  if (!merchantId || !publicKey || !privateKey) {
    throw new Error(
      "Missing Braintree credentials. Set BRAINTREE_MERCHANT_ID, BRAINTREE_PUBLIC_KEY, BRAINTREE_PRIVATE_KEY",
    )
  }

  return new braintree.BraintreeGateway({
    environment: getEnv(),
    merchantId,
    publicKey,
    privateKey,
  })
}

export type BraintreeTransactionResult = {
  success: boolean
  transactionId?: string
  status?: string
  message?: string
  processorResponseText?: string
  processorResponseCode?: string
}
