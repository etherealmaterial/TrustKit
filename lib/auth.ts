import { cookies } from "next/headers"
import { COOKIE_NAME, signSession, verifySession, type SessionPayload } from "./jwt"
import type { User } from "./users/types"

export async function createSession(user: User) {
  const token = await signSession({ sub: user.id, email: user.email, role: user.role })
  const c = cookies()
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function clearSession() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 })
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    return await verifySession(token)
  } catch {
    return null
  }
}

export async function requireAdmin(): Promise<SessionPayload> {
  const sess = await getSessionUser()
  if (!sess || sess.role !== "admin") throw new Error("Unauthorized")
  return sess
}
