import { SignJWT, jwtVerify } from "jose"

const COOKIE_NAME = "session"

function getSecret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error("JWT_SECRET not set")
  return new TextEncoder().encode(s)
}

export interface SessionPayload {
  sub: string
  email: string
  role: "admin" | "user"
}

export async function signSession(payload: SessionPayload) {
  const secret = getSecret()
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifySession(token: string) {
  const secret = getSecret()
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as SessionPayload
}

export { COOKIE_NAME }
