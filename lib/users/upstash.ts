import type { UsersAdapter, User, CreateUserInput, UpdateUserInput } from "./types"
import bcrypt from "bcryptjs"

let Redis: any = null
function getRedis() {
  if (!Redis) {
    // Lazy import to avoid bundling @upstash/redis on client
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Redis = require("@upstash/redis").Redis
  }
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null
  return new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  })
}

// Key helpers
const kUser = (id: string) => `user:${id}`
const kEmail = (email: string) => `user:email:${email.toLowerCase()}`
const kIndex = "users:index"

export function createUpstashAdapter(): UsersAdapter {
  const redis = getRedis()
  if (!redis) {
    throw new Error("Upstash Redis is not configured")
  }

  return {
    async countUsers() {
      const ids = (await redis.smembers(kIndex)) as string[]
      return ids?.length || 0
    },
    async listUsers() {
      const ids = (await redis.smembers(kIndex)) as string[]
      if (!ids || ids.length === 0) return []
      const pipeline = redis.pipeline()
      ids.forEach((id: string) => pipeline.get(kUser(id)))
      const res = (await pipeline.exec()) as any[]
      return res
        .map(([, json]) => (json ? (JSON.parse(json) as User) : null))
        .filter(Boolean)
        .sort((a: User, b: User) => a.createdAt - b.createdAt)
    },
    async getUserById(id: string) {
      const json = await redis.get(kUser(id))
      return json ? (JSON.parse(json) as User) : null
    },
    async getUserByEmail(email: string) {
      const id = await redis.get(kEmail(email))
      if (!id) return null
      return this.getUserById(id as string)
    },
    async createUser(input: CreateUserInput) {
      const email = input.email.toLowerCase().trim()
      const existing = await redis.get(kEmail(email))
      if (existing) throw new Error("Email already exists")
      const id = crypto.randomUUID()
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
      const pipeline = redis.pipeline()
      pipeline.set(kUser(id), JSON.stringify(user))
      pipeline.set(kEmail(email), id)
      pipeline.sadd(kIndex, id)
      await pipeline.exec()
      return user
    },
    async updateUser(id: string, input: UpdateUserInput) {
      const json = await redis.get(kUser(id))
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
      await redis.set(kUser(id), JSON.stringify(next))
      return next
    },
    async deleteUser(id: string) {
      const user = await this.getUserById(id)
      if (!user) return false
      const pipeline = redis.pipeline()
      pipeline.del(kUser(id))
      pipeline.del(kEmail(user.email))
      pipeline.srem(kIndex, id)
      await pipeline.exec()
      return true
    },
  }
}
