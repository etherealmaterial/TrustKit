import { NextResponse } from "next/server"
import { users } from "@/lib/users"
import bcrypt from "bcryptjs"
import { signSession } from "@/lib/jwt"
import { config, assertSecrets } from "@/lib/config"

assertSecrets()

export async function POST(req: Request) {
  try {
    const { email: rawEmail, password } = await req.json()
    const email = String(rawEmail || "")
      .toLowerCase()
      .trim()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }
    const store = users()
    const u = await store.getUserByEmail(email)
    if (!u || !u.active) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
    const ok = await bcrypt.compare(password, u.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
    const token = await signSession({ sub: u.id, email: u.email, role: u.role }, config.sessionMaxAgeSeconds)
    const res = NextResponse.json({
      user: { id: u.id, email: u.email, name: u.name, role: u.role },
    })
    res.cookies.set({
      name: config.sessionCookieName,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: config.sessionMaxAgeSeconds,
    })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Login failed" }, { status: 400 })
  }
}
