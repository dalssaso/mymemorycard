import type { InferSelectModel } from 'drizzle-orm'
import type { users } from '@/db/schema'

type User = InferSelectModel<typeof users>

export interface AuthResult {
  user: {
    id: string
    username: string
    email: string
  }
  token: string
}

export interface IAuthService {
  register(username: string, email: string, password: string): Promise<AuthResult>
  login(username: string, password: string): Promise<AuthResult>
  validateToken(token: string): Promise<User | null>
}
