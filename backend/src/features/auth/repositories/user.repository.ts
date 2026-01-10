import { injectable, inject } from "tsyringe";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import type { InferSelectModel } from "drizzle-orm";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ConflictError } from "@/shared/errors/base";
import type { IUserRepository } from "./user.repository.interface";

type User = InferSelectModel<typeof users>;

@injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(@inject("Database") private db: DrizzleDB) {}

  async findByUsername(username: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);

    return result[0] ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);

    return result[0] ?? null;
  }

  async create(username: string, email: string, passwordHash: string): Promise<User> {
    try {
      const result = await this.db
        .insert(users)
        .values({
          username,
          email,
          passwordHash,
        })
        .returning();

      if (!result || result.length === 0 || !result[0]) {
        throw new Error("Failed to create user: insert returned no rows");
      }

      return result[0];
    } catch (error) {
      // Handle unique constraint violations
      if (
        error instanceof Error &&
        error.message.includes("unique constraint") &&
        error.message.includes("username")
      ) {
        throw new ConflictError(`User with username "${username}" already exists`);
      }

      if (
        error instanceof Error &&
        error.message.includes("unique constraint") &&
        error.message.includes("email")
      ) {
        throw new ConflictError(`User with email "${email}" already exists`);
      }

      // Re-throw ConflictError as-is
      if (error instanceof ConflictError) {
        throw error;
      }

      // Re-throw other errors with context
      if (error instanceof Error) {
        throw new Error(`Failed to create user: ${error.message}`);
      }

      throw new Error("Failed to create user: unknown error");
    }
  }

  async exists(username: string): Promise<boolean> {
    const result = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return result.length > 0;
  }
}
