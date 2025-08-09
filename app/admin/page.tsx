"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type User = { id: string; email: string; name: string; role: string; active: boolean }

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    const res = await fetch("/api/admin/users")
    const json = await res.json()
    if (!json.ok) {
      setError(json.error || "Failed to load users")
      return
    }
    setUsers(json.users)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{"Admin • Users"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="text-red-600">{error}</div>}
          <div className="flex justify-end">
            <Button onClick={load} variant="outline">
              {"Refresh"}
            </Button>
          </div>
          <div className="divide-y">
            {users.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{u.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {u.role} • {u.active ? "active" : "disabled"}
                  </div>
                </div>
              </div>
            ))}
            {users.length === 0 && <div className="py-8 text-center text-muted-foreground">{"No users yet."}</div>}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
