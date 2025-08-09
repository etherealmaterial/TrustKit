import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

function StatusBadge({ ok }: { ok: boolean }) {
  return <Badge variant={ok ? "secondary" : "destructive"}>{ok ? "Configured" : "Missing"}</Badge>
}

export default async function PreviewPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/deploy/status`, {
    cache: "no-store",
  }).catch(() => null)

  const data =
    (await res?.json().catch(() => null)) ||
    ({
      timestamp: new Date().toISOString(),
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
    } as any)

  const vercel = data.environment?.vercel || {}
  const envVars = data.envVars || {}

  const rows: { key: keyof typeof envVars; label: string; hint?: string }[] = [
    { key: "STRIPE_SECRET_KEY", label: "STRIPE_SECRET_KEY", hint: "Server-only" },
    { key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", label: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" },
    { key: "NEXT_PUBLIC_BASE_URL", label: "NEXT_PUBLIC_BASE_URL", hint: "https://your-app.vercel.app" },
    { key: "NEXT_PUBLIC_PAYPAL_CLIENT_ID", label: "NEXT_PUBLIC_PAYPAL_CLIENT_ID" },
    { key: "PAYPAL_SECRET", label: "PAYPAL_SECRET", hint: "Server-only" },
    { key: "PAYPAL_ENV", label: "PAYPAL_ENV", hint: "sandbox | live" },
    { key: "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID", label: "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID" },
    { key: "NEXT_PUBLIC_THIRDWEB_CLIENT_ID", label: "NEXT_PUBLIC_THIRDWEB_CLIENT_ID" },
  ]

  return (
    <main className="container mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Deployment Preview & Environment Check</h1>
        <p className="text-muted-foreground mt-2">
          Verify required environment variables and see deployment metadata. Push a branch to trigger a Vercel Preview
          Deployment and share the URL for review.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
            <CardDescription>Presence-only check (values are not shown)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.map((row) => (
              <div key={row.key} className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-sm">{row.label}</div>
                  {row.hint ? <div className="text-xs text-muted-foreground">{row.hint}</div> : null}
                </div>
                <StatusBadge ok={Boolean(envVars[row.key])} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deployment Info</CardTitle>
            <CardDescription>Pulled from runtime environment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Timestamp</div>
              <div className="text-sm">{data.timestamp}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Node Env</div>
              <div className="text-sm">{data.environment?.nodeEnv || "unknown"}</div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Vercel Env</div>
              <div className="text-sm">{vercel.vercelEnv || "n/a"}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Commit</div>
              <div className="text-sm">{vercel.vercelGitCommitSha || "n/a"}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Branch</div>
              <div className="text-sm">{vercel.vercelGitCommitRef || "n/a"}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Provider</div>
              <div className="text-sm">{vercel.vercelGitProvider || "n/a"}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Preview URL</div>
              <div className="text-sm break-all">{vercel.vercelUrl || "n/a"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Test flows and checks</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Link href="/api/deploy/status">
            <Button variant="outline">View JSON status</Button>
          </Link>
          <Link href="/buy-eth">
            <Button>Buy 1 ETH</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/admin">
            <Button>Admin Portal</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
