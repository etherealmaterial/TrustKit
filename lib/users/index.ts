import { createMemoryAdapter } from "./memory"
import { createUpstashAdapter } from "./upstash"
import type { UsersAdapter } from "./types"

let singleton: UsersAdapter | null = null

export function users(): UsersAdapter {
  if (singleton) return singleton
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      singleton = createUpstashAdapter()
      return singleton
    } catch {
      // fall through to memory if misconfigured
    }
  }
  singleton = createMemoryAdapter()
  return singleton
}
