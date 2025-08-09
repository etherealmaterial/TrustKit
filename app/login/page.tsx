"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [allowSignup, setAllowSignup] = useState(false)

  useEffect(() => {
    fetch("/api/setup/status")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setAllowSignup(j.count === 0 || process.env.NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP === "true")
          if (j.count === 0) setMode("signup")
        }
      })
      .catch(() => {})
  }, [])

  async function onLogin() {
    setError(null)
    setInfo(null)
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json()
    if (!json.ok) {
      setError(json.error || "Login failed")
      return
    }
    setInfo("Logged in. You can now credit your account.")
    window.location.href = "/credit-account"
  }

  async function onSignup() {
    setError(null)
    setInfo(null)
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    })
    const json = await res.json()
    if (!json.ok) {
      setError(json.error || "Signup failed")
      return
    }
    setInfo("Account created. Redirecting to credit your account...")
    window.location.href = "/credit-account"
  }

  return (
    <main className="min-h-[70vh] grid place-items-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === "login" ? "Login" : "Create your account"}</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Access your account to start crediting funds"
              : "Sign up to get started, then credit your account as step one"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "signup" && <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />}
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {info && (
            <Alert>
              <AlertDescription>{info}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            {mode === "login" ? (
              <>
                <Button onClick={onLogin} className="flex-1">
                  {"Login"}
                </Button>
                {allowSignup && (
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setMode("signup")}>
                    {"Create account"}
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button onClick={onSignup} className="flex-1">
                  {"Sign up"}
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setMode("login")}>
                  {"Back to login"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
