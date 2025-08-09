import { NextResponse } from "next/server"
import { users } from "@/lib/users"
import { requireAdmin } from "@/lib/auth"
import type { UpdateUserInput } from "@/lib/users/types"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await requireAdmin()
  const store = users()
  const body = (await req.json()) as UpdateUserInput
  const updated = await store.updateUser(params.id, body)
  return NextResponse.json({
    user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role, active: updated.active },
  })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await requireAdmin()
  const store = users()
  const ok = await store.deleteUser(params.id)
  return NextResponse.json({ ok })
}
