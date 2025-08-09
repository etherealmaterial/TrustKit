import { NextResponse } from "next/server"
import { users } from "@/lib/users"
import { requireAdmin } from "@/lib/auth"
import type { CreateUserInput } from "@/lib/users/types"

export async function GET() {
  await requireAdmin()
  const store = users()
  const all = await store.listUsers()
  const sanitized = all.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt,
  }))
  return NextResponse.json({ users: sanitized })
}

export async function POST(req: Request) {
  await requireAdmin()
  const store = users()
  const body = (await req.json()) as Partial<CreateUserInput>
  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 })
  }
  const user = await store.createUser({
    email: String(body.email),
    name: String(body.name || ""),
    password: String(body.password),
    role: (body.role as any) || "user",
    active: body.active ?? true,
  })
  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, active: user.active },
  })
}
