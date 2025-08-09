import { NextResponse } from "next/server"
import { users } from "@/lib/users"
import type { CreateUserInput } from "@/lib/users/types"
import { config, assertSecrets } from "@/lib/config"

assertSecrets()

export async function POST(req: Request) {
  try {
    if (!config.allowPublicSignup) {
      return NextResponse.json({ error: "Public signup disabled" }, { status: 403 })
    }
    const body = (await req.json()) as Partial<CreateUserInput>
    const email = String(body.email || "")
      .toLowerCase()
      .trim()
    const password = String(body.password || "")
    const name = String(body.name || "")
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }
    const store = users()
    const count = await store.countUsers()
    const role = count === 0 ? "admin" : body.role || "user"
    const user = await store.createUser({ email, password, name, role })
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Signup failed" }, { status: 400 })
  }
}
