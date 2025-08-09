export type Role = "admin" | "user"

export type User = {
  id: string
  email: string
  name?: string
  role: Role
  passwordHash: string
  active: boolean
  createdAt: number
  updatedAt: number
}

export type CreateUserInput = {
  email: string
  name?: string
  password: string
  role?: Role
  active?: boolean
}

export type UpdateUserInput = Partial<Pick<User, "name" | "role" | "active">> & {
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
