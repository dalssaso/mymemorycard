import { injectable, inject } from 'tsyringe'
import type { DrizzleDB } from '@/infrastructure/database/connection'
import type { InferSelectModel } from 'drizzle-orm'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { IUserRepository } from './user.repository.interface'

type User = InferSelectModel<typeof users>

@injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(@inject('Database') private db: DrizzleDB) {}

  async findByUsername(username: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1)

    return result[0] ?? null
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1)

    return result[0] ?? null
  }

  async create(username: string, email: string, passwordHash: string): Promise<User> {
    const result = await this.db
      .insert(users)
      .values({
        username,
        email,
        passwordHash,
      })
      .returning()

    return result[0]
  }

  async exists(username: string): Promise<boolean> {
    const result = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1)

    return result.length > 0
  }
}
