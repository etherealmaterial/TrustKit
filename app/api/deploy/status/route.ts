import { NextResponse } from "next/server"

export async function GET() {
  const now = new Date().toISOString()

  const payload = {
    timestamp: now,
    environment: {
      nodeEnv: process.env.NODE_ENV || "development",
      vercel: {
        vercelEnv: process.env.VERCEL_ENV || null,
        vercelUrl: process.env.VERCEL_URL || null,
        vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
        vercelGitCommitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
        vercelGitProvider: process.env.VERCEL_GIT_PROVIDER || null,
      },
    },
    envVars: {
      STRIPE_SECRET_KEY: Boolean(process.env.STRIPE_SECRET_KEY),
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      NEXT_PUBLIC_BASE_URL: Boolean(process.env.NEXT_PUBLIC_BASE_URL),
      NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID),
      NEXT_PUBLIC_THIRDWEB_CLIENT_ID: Boolean(process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID),
      NEXT_PUBLIC_PAYPAL_CLIENT_ID: Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID),
      PAYPAL_SECRET: Boolean(process.env.PAYPAL_SECRET),
      PAYPAL_ENV: process.env.PAYPAL_ENV || "sandbox",
    },
  }

  return NextResponse.json(payload, { status: 200 })
}
