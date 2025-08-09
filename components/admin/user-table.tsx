"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

type UserRow = {
  id: string
  email: string
  name?: string
  role: "admin" | "user"
  active: boolean
  createdAt: number
}

export default function UserTable() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [cEmail, setCEmail] = useState("")
  const [cName, setCName] = useState("")
  const [cPassword, setCPassword] = useState("")
  const [cRole, setCRole] = useState<"admin" | "user">("user")

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load users")
      setUsers(data.users || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function createUser() {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: cEmail, name: cName, password: cPassword, role: cRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create user")
      setCreateOpen(false)
      setCEmail("")
      setCName("")
      setCPassword("")
      await load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  async function setRole(id: string, role: "admin" | "user") {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error("Failed to update role")
      await load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      await load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete user? This cannot be undone.")) return
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete user")
      await load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const body = useMemo(() => {
    if (loading) return <div className="text-sm text-muted-foreground p-4">Loading users...</div>
    if (error) return <div className="text-sm text-red-600 p-4">{error}</div>
    if (!users.length) return <div className="text-sm text-muted-foreground p-4">No users yet.</div>
    return (
      <div className="divide-y">
        {users.map((u) => (
          <div key={u.id} className="grid grid-cols-1 md:grid-cols-6 items-center gap-2 py-3">
            <div className="md:col-span-2">
              <div className="font-medium">{u.email}</div>
              <div className="text-xs text-muted-foreground">{u.name}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={u.role === "admin" ? "secondary" : "outline"}>{u.role}</Badge>
              <Select defaultValue={u.role} onValueChange={(v) => setRole(u.id, v as any)}>
                <SelectTrigger className="h-8 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={u.active ? "secondary" : "destructive"}>{u.active ? "active" : "inactive"}</Badge>
              <Button variant="outline" size="sm" onClick={() => toggleActive(u.id, !u.active)}>
                {u.active ? "Deactivate" : "Activate"}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</div>
            <div className="flex justify-end">
              <Button variant="destructive" size="sm" onClick={() => deleteUser(u.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }, [loading, error, users])

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Users</div>
            <div className="text-sm text-muted-foreground">Manage user accounts, roles, and status.</div>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>Create User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    type="email"
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Optional" />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input value={cPassword} onChange={(e) => setCPassword(e.target.value)} type="password" />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={cRole} onValueChange={(v) => setCRole(v as any)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">user</SelectItem>
                      <SelectItem value="admin">admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button onClick={createUser}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {body}
      </CardContent>
    </Card>
  )
}
