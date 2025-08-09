import { NextResponse } from "next/server"
import { config } from "@/lib/config"

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name: config.sessionCookieName,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  return res
}
