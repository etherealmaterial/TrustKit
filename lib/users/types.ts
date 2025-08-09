export type Role = "admin" | "user"

export interface User {
  id: string
  email: string
  name: string
  role: Role
  active: boolean
  passwordHash: string
  createdAt: number
  updatedAt: number
}

export interface CreateUserInput {
  email: string
  password: string
  name?: string
  role?: Role
  active?: boolean
}

export interface UpdateUserInput {
  name?: string
  role?: Role
  active?: boolean
  password?: string
}

export interface UsersAdapter {
  countUsers(): Promise<number>
  listUsers(): Promise<User[]>
  getUserById(id: string): Promise<User | null>
  getUserByEmail(email: string): Promise<User | null>
  createUser(input: CreateUserInput): Promise<User>
  updateUser(id: string, input: UpdateUserInput): Promise<User>
  deleteUser(id: string): Promise<boolean>
}
