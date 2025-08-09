import { NextResponse } from "next/server"
import { getUsersAdapter } from "@/lib/users"
import type { CreateUserInput } from "@/lib/users/types"
import { createSession } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const adapter = getUsersAdapter()
    const count = await adapter.countUsers()
    if (count > 0) {
      return NextResponse.json({ ok: false, error: "Already initialized" }, { status: 400 })
    }
    const body = (await req.json()) as CreateUserInput
    if (!body?.email || !body?.password) {
      return NextResponse.json({ ok: false, error: "Email and password required" }, { status: 400 })
    }
    const admin = await adapter.createUser({
      email: body.email,
      password: body.password,
      name: body.name ?? "Admin",
      role: "admin",
      active: true,
    })
    await createSession(admin)
    return NextResponse.json({ ok: true, admin: { id: admin.id, email: admin.email, role: admin.role } })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Bootstrap failed" }, { status: 500 })
  }
}
