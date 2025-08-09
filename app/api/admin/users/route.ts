import { NextResponse } from "next/server"
import { users } from "@/lib/users"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()
    const list = await users().listUsers()
    return NextResponse.json({
      ok: true,
      users: list.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, active: u.active })),
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unauthorized" }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()
    const u = await users().createUser({
      email: body.email,
      password: body.password,
      name: body.name,
      role: body.role,
      active: body.active,
    })
    return NextResponse.json({ ok: true, user: { id: u.id, email: u.email, role: u.role, active: u.active } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Create failed" }, { status: 400 })
  }
}
