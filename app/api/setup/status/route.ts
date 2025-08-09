import { NextResponse } from "next/server"
import { users } from "@/lib/users"

export async function GET() {
  try {
    const store = users()
    const count = await store.countUsers()
    return NextResponse.json({ ok: true, count })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "status error" }, { status: 500 })
  }
}
