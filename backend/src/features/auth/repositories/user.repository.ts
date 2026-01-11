import { injectable, inject } from "tsyringe";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ConflictError } from "@/shared/errors/base";
import type { IUserRepository, User } from "./user.repository.interface";

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
      // Re-throw ConflictError as-is
      if (error instanceof ConflictError) {
        throw error;
      }

      // Check for PostgreSQL unique constraint violations using SQLSTATE code (preferred)
      // Falls back to message matching for errors without SQLSTATE code (e.g., in tests)
      if (error instanceof Error) {
        // SQLSTATE 23505 = unique_violation
        // error.code or error.cause?.code contains the SQLSTATE
        const errorCode =
          (error as unknown as Record<string, unknown>).code ||
          (error.cause instanceof Error
            ? (error.cause as unknown as Record<string, unknown>).code
            : undefined);

        if (errorCode === "23505") {
          // Distinguish username vs email constraint violations using constraint name
          const constraintName =
            (error as unknown as Record<string, unknown>).constraint ||
            (error.cause instanceof Error
              ? (error.cause as unknown as Record<string, unknown>).constraint
              : undefined);

          if (typeof constraintName === "string" && constraintName.includes("username")) {
            throw new ConflictError(`User with username "${username}" already exists`);
          }

          if (typeof constraintName === "string" && constraintName.includes("email")) {
            throw new ConflictError(`User with email "${email}" already exists`);
          }

          // Fallback if constraint name doesn't indicate which field
          throw new ConflictError("User with provided username or email already exists");
        }

        // Fallback to message matching for errors without SQLSTATE code (e.g., mocked errors in tests)
        if (error.message.includes("unique constraint") && error.message.includes("username")) {
          throw new ConflictError(`User with username "${username}" already exists`);
        }

        if (error.message.includes("unique constraint") && error.message.includes("email")) {
          throw new ConflictError(`User with email "${email}" already exists`);
        }

        // Re-throw other errors with context
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
