import { SignJWT, jwtVerify } from "jose"
import { config } from "./config"

const encoder = new TextEncoder()
const secret = encoder.encode(config.jwtSecret)

export type JwtPayload = {
  sub: string
  email: string
  role: "admin" | "user"
}

export async function signSession(payload: JwtPayload, maxAgeSeconds: number) {
  const now = Math.floor(Date.now() / 1000)
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(now + maxAgeSeconds)
    .sign(secret)
}

export async function verifySession(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}
