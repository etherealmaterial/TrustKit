import { NextResponse } from "next/server"
import { users } from "@/lib/users"

export async function GET() {
  const store = users()
  const count = await store.countUsers()
  return NextResponse.json({ userCount: count })
}
