import bcrypt from "bcryptjs"
import type { UsersAdapter, User, CreateUserInput, UpdateUserInput } from "./types"

function getUpstashEnv() {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) {
    throw new Error("Upstash Redis is not configured")
  }
  return { url: url.replace(/\/+$/, ""), token }
}

// Call Upstash REST API
async function upstash<T = unknown>(
  url: string,
  token: string,
  cmd: string,
  ...args: Array<string | number | boolean>
): Promise<T> {
  const path = [cmd, ...args.map((a) => encodeURIComponent(String(a)))].join("/")
  const res = await fetch(`${url}/${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Upstash error on ${cmd}: ${res.status} ${text}`)
  }
  const data = (await res.json().catch(() => ({}))) as { result?: T }
  return data.result as T
}

const kUser = (id: string) => `user:${id}`
const kEmail = (email: string) => `user:email:${email.toLowerCase()}`
const kIndex = "users:index"

function makeId() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = (globalThis as any).crypto
    if (c?.randomUUID) return c.randomUUID()
  } catch {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function createUpstashAdapter(): UsersAdapter {
  const { url, token } = getUpstashEnv()

  return {
    async countUsers() {
      const ids = (await upstash<string[]>(url, token, "smembers", kIndex)) || []
      return ids.length
    },
    async listUsers() {
      const ids = (await upstash<string[]>(url, token, "smembers", kIndex)) || []
      if (ids.length === 0) return []
      const users: User[] = []
      for (const id of ids) {
        const json = (await upstash<string | null>(url, token, "get", kUser(id))) || null
        if (json) {
          try {
            users.push(JSON.parse(json) as User)
          } catch {}
        }
      }
      return users.sort((a, b) => a.createdAt - b.createdAt)
    },
    async getUserById(id: string) {
      const json = (await upstash<string | null>(url, token, "get", kUser(id))) || null
      return json ? (JSON.parse(json) as User) : null
    },
    async getUserByEmail(email: string) {
      const id = (await upstash<string | null>(url, token, "get", kEmail(email))) || null
      if (!id) return null
      return this.getUserById(id)
    },
    async createUser(input: CreateUserInput) {
      const email = input.email.toLowerCase().trim()
      const existing = (await upstash<string | null>(url, token, "get", kEmail(email))) || null
      if (existing) throw new Error("Email already exists")

      const id = makeId()
      const now = Date.now()
      const passwordHash = await bcrypt.hash(input.password, 10)
      const user: User = {
        id,
        email,
        name: input.name || "",
        role: input.role || "user",
        active: input.active ?? true,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      }

      await upstash(url, token, "set", kUser(id), JSON.stringify(user))
      await upstash(url, token, "set", kEmail(email), id)
      await upstash(url, token, "sadd", kIndex, id)

      return user
    },
    async updateUser(id: string, input: UpdateUserInput) {
      const json = (await upstash<string | null>(url, token, "get", kUser(id))) || null
      if (!json) throw new Error("User not found")
      const u = JSON.parse(json) as User
      const changes: Partial<User> = {}

      if (typeof input.name === "string") changes.name = input.name
      if (input.role) changes.role = input.role
      if (typeof input.active === "boolean") changes.active = input.active
      if (input.password) {
        changes.passwordHash = await bcrypt.hash(input.password, 10)
      }

      const next: User = { ...u, ...changes, updatedAt: Date.now() }
      await upstash(url, token, "set", kUser(id), JSON.stringify(next))
      return next
    },
    async deleteUser(id: string) {
      const user = await this.getUserById(id)
      if (!user) return false
      await upstash(url, token, "del", kUser(id))
      await upstash(url, token, "del", kEmail(user.email))
      await upstash(url, token, "srem", kIndex, id)
      return true
    },
  }
}
