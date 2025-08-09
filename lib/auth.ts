import { cookies, headers } from "next/headers"
import { config } from "./config"
import { verifySession } from "./jwt"
import { users } from "./users"
import type { User } from "./users/types"

export type SessionUser = Pick<User, "id" | "email" | "name" | "role" | "active">

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = users()
  const token = cookies().get(config.sessionCookieName)?.value
  if (!token) return null
  const payload = await verifySession(token)
  if (!payload) return null
  const u = await store.getUserById(payload.sub)
  if (!u || !u.active) return null
  return { id: u.id, email: u.email, name: u.name, role: u.role, active: u.active }
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await getCurrentUser()
  if (!u || u.role !== "admin") {
    const h = headers()
    const path = h.get("x-pathname") || "/"
    const err = new Error(`Unauthorized to access ${path}`)
    ;(err as any).status = 401
    throw err
  }
  return u
}
