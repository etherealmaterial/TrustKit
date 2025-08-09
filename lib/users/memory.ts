import type { UsersAdapter, User, CreateUserInput, UpdateUserInput } from "./types"
import crypto from "crypto"
import bcrypt from "bcryptjs"

type DB = {
  byId: Map<string, User>
  byEmail: Map<string, string> // email -> id
}

function getDB(): DB {
  const g = globalThis as any
  if (!g.__MEM_DB__) {
    g.__MEM_DB__ = { byId: new Map<string, User>(), byEmail: new Map<string, string>() }
  }
  return g.__MEM_DB__ as DB
}

export function createMemoryAdapter(): UsersAdapter {
  const db = getDB()

  return {
    async countUsers() {
      return db.byId.size
    },
    async listUsers() {
      return Array.from(db.byId.values()).sort((a, b) => a.createdAt - b.createdAt)
    },
    async getUserById(id: string) {
      return db.byId.get(id) || null
    },
    async getUserByEmail(email: string) {
      const id = db.byEmail.get(email.toLowerCase())
      return id ? db.byId.get(id) || null : null
    },
    async createUser(input: CreateUserInput) {
      const email = input.email.toLowerCase().trim()
      if (db.byEmail.has(email)) {
        throw new Error("Email already exists")
      }
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
      db.byId.set(id, user)
      db.byEmail.set(email, id)
      return user
    },
    async updateUser(id: string, input: UpdateUserInput) {
      const u = db.byId.get(id)
      if (!u) throw new Error("User not found")
      const changes: Partial<User> = {}
      if (typeof input.name === "string") changes.name = input.name
      if (input.role) changes.role = input.role
      if (typeof input.active === "boolean") changes.active = input.active
      if (input.password) {
        changes.passwordHash = await (await import("bcryptjs")).default.hash(input.password, 10)
      }
      const next = { ...u, ...changes, updatedAt: Date.now() }
      db.byId.set(id, next)
      return next
    },
    async deleteUser(id: string) {
      const u = db.byId.get(id)
      if (!u) return false
      db.byId.delete(id)
      db.byEmail.delete(u.email.toLowerCase())
      return true
    },
  }
}
