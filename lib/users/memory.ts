import bcrypt from "bcryptjs"
import type { UsersAdapter, User, CreateUserInput, UpdateUserInput } from "./types"

const usersById = new Map<string, User>()
const idByEmail = new Map<string, string>()

function makeId() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = (globalThis as any).crypto
    if (c?.randomUUID) return c.randomUUID()
  } catch {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function createMemoryAdapter(): UsersAdapter {
  return {
    async countUsers() {
      return usersById.size
    },
    async listUsers() {
      return Array.from(usersById.values()).sort((a, b) => a.createdAt - b.createdAt)
    },
    async getUserById(id: string) {
      return usersById.get(id) ?? null
    },
    async getUserByEmail(email: string) {
      const id = idByEmail.get(email.toLowerCase().trim())
      return id ? (usersById.get(id) ?? null) : null
    },
    async createUser(input: CreateUserInput) {
      const email = input.email.toLowerCase().trim()
      if (idByEmail.has(email)) throw new Error("Email already exists")
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
      usersById.set(id, user)
      idByEmail.set(email, id)
      return user
    },
    async updateUser(id: string, input: UpdateUserInput) {
      const u = usersById.get(id)
      if (!u) throw new Error("User not found")
      const changes: Partial<User> = {}
      if (typeof input.name === "string") changes.name = input.name
      if (input.role) changes.role = input.role
      if (typeof input.active === "boolean") changes.active = input.active
      if (input.password) {
        changes.passwordHash = await bcrypt.hash(input.password, 10)
      }
      const merged: User = { ...u, ...changes, updatedAt: Date.now() }
      usersById.set(id, merged)
      return merged
    },
    async deleteUser(id: string) {
      const u = usersById.get(id)
      if (!u) return false
      usersById.delete(id)
      idByEmail.delete(u.email)
      return true
    },
  }
}
