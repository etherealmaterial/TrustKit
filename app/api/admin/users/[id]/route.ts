import { NextResponse } from "next/server"
import { users } from "@/lib/users"
import { requireAdmin } from "@/lib/auth"

export async function PATCH(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const body = await _.json().catch(() => ({}))
    const u = await users().updateUser(params.id, {
      name: body.name,
      role: body.role,
      active: body.active,
      password: body.password,
    })
    return NextResponse.json({ ok: true, user: { id: u.id, email: u.email, role: u.role, active: u.active } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Update failed" }, { status: 400 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const ok = await users().deleteUser(params.id)
    return NextResponse.json({ ok })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Delete failed" }, { status: 400 })
  }
}
