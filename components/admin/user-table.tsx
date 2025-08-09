"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type User = { id: string; email: string; name?: string; role: "admin" | "user"; active: boolean }

export default function UserTable() {
  const [users, setUsers] = useState<User[]>([])
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function load() {
    const res = await fetch("/api/admin/users")
    const json = await res.json()
    if (json.ok) setUsers(json.users)
  }

  useEffect(() => {
    load()
  }, [])

  async function addUser(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json()
    if (!json.ok) {
      setMsg(json.error ?? "Create failed")
    } else {
      setMsg("User created")
      setEmail("")
      setPassword("")
      load()
    }
    setLoading(false)
  }

  async function toggleActive(u: User) {
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    })
    load()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addUser} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label htmlFor="email">{"Email"}</Label>
          <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="password">{"Password"}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add User"}
          </Button>
        </div>
      </form>
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      <div className="border rounded-md">
        <div className="grid grid-cols-5 gap-2 p-2 font-medium">
          <div>{"Email"}</div>
          <div>{"Name"}</div>
          <div>{"Role"}</div>
          <div>{"Active"}</div>
          <div>{"Actions"}</div>
        </div>
        {users.map((u) => (
          <div key={u.id} className="grid grid-cols-5 gap-2 p-2 border-t text-sm">
            <div>{u.email}</div>
            <div>{u.name || "-"}</div>
            <div className="uppercase">{u.role}</div>
            <div>{u.active ? "Yes" : "No"}</div>
            <div className="space-x-2">
              <Button variant="secondary" size="sm" onClick={() => toggleActive(u)}>
                {u.active ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
