import { createMemoryAdapter } from "./memory"
import { createUpstashAdapter } from "./upstash"
import type { UsersAdapter } from "./types"

let adapter: UsersAdapter | null = null

export function users(): UsersAdapter {
  if (adapter) return adapter
  const hasUpstash = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  adapter = hasUpstash ? createUpstashAdapter() : createMemoryAdapter()
  return adapter
}
