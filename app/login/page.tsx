"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const search = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [setupMode, setSetupMode] = useState(false)
  const [userCount, setUserCount] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/setup/status").then(async (r) => {
      const j = await r.json()
      setUserCount(j.userCount)
      setSetupMode(j.userCount === 0)
    })
  }, [])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Login failed")
      const redirect = search.get("redirect") || "/admin"
      router.push(redirect)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function bootstrap(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, name: "Admin" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Bootstrap failed")
      // After bootstrap, login automatically
      await login(e as any)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{setupMode ? "Initialize Admin" : "Sign in"}</CardTitle>
          <CardDescription>
            {setupMode ? "No users found. Create the first admin account." : "Sign in to manage your portal."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Tabs defaultValue={setupMode ? "bootstrap" : "login"}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login" disabled={setupMode}>
                Login
              </TabsTrigger>
              <TabsTrigger value="bootstrap">First Admin</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form className="space-y-4 mt-4" onSubmit={login}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="bootstrap">
              <form className="space-y-4 mt-4" onSubmit={bootstrap}>
                <div className="space-y-2">
                  <Label htmlFor="email-b">Admin Email</Label>
                  <Input id="email-b" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-b">Admin Password</Label>
                  <Input
                    id="password-b"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating..." : "Create Admin"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Users in system: {userCount ?? "-"}</p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
}
