import { NextResponse } from "next/server"
import { users } from "@/lib/users"
import { createSession } from "@/lib/auth"

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string; password?: string; name?: string } | null
  if (!body?.email || !body?.password) {
    return NextResponse.json({ ok: false, error: "Email and password required" }, { status: 400 })
  }

  try {
    const store = users()
    const count = await store.countUsers()
    const allowEnv = process.env.ALLOW_PUBLIC_SIGNUP === "true"
    const allow = allowEnv || count === 0
    if (!allow) {
      return NextResponse.json({ ok: false, error: "Signups are disabled" }, { status: 403 })
    }
    const role = count === 0 ? "admin" : "user"
    const u = await store.createUser({
      email: body.email,
      password: body.password,
      name: body.name ?? "",
      role,
      active: true,
    })
    await createSession(u)
    return NextResponse.json({ ok: true, user: { id: u.id, email: u.email, role: u.role } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Signup failed" }, { status: 500 })
  }
}
