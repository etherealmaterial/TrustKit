import { NextResponse } from "next/server"
import { users } from "@/lib/users"
import bcrypt from "bcryptjs"
import { createSession } from "@/lib/auth"

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}))
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Email and password required" }, { status: 400 })
  }
  const store = users()
  const u = await store.getUserByEmail(String(email))
  if (!u) return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 })
  if (!u.active) return NextResponse.json({ ok: false, error: "Account disabled" }, { status: 403 })
  const ok = await bcrypt.compare(String(password), u.passwordHash)
  if (!ok) return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 })
  await createSession(u)
  return NextResponse.json({ ok: true, user: { id: u.id, email: u.email, role: u.role } })
}
