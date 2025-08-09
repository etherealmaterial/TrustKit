import { NextResponse } from "next/server"
import { users } from "@/lib/users"

export async function POST(req: Request) {
  const { email, password, name } = await req.json().catch(() => ({}))
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 })
  }
  const store = users()
  const count = await store.countUsers()
  if (count > 0) {
    return NextResponse.json({ error: "Admin already initialized" }, { status: 403 })
  }
  const user = await store.createUser({ email, password, name, role: "admin", active: true })
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } })
}
