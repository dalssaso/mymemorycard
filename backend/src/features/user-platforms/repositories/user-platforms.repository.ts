import { injectable, inject } from "tsyringe";
import { eq, and } from "drizzle-orm";

import { DATABASE_TOKEN } from "@/container/tokens";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import { userPlatforms } from "@/db/schema";
import { ConflictError, NotFoundError } from "@/shared/errors/base";
import type { CreateUserPlatformInput, UpdateUserPlatformInput, UserPlatform } from "../types";

import type { IUserPlatformsRepository } from "./user-platforms.repository.interface";

/**
 * PostgreSQL implementation of the UserPlatformsRepository interface using Drizzle ORM.
 * Manages CRUD operations for user-platform associations.
 */
@injectable()
export class PostgresUserPlatformsRepository implements IUserPlatformsRepository {
  constructor(@inject(DATABASE_TOKEN) private db: DrizzleDB) {}

  /**
   * Find a user-platform association by ID
   *
   * @param id - The user-platform association ID
   * @returns The user-platform association or null if not found
   */
  async findById(id: string): Promise<UserPlatform | null> {
    const result = await this.db
      .select()
      .from(userPlatforms)
      .where(eq(userPlatforms.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Find all platform associations for a specific user
   *
   * @param userId - The user ID
   * @returns Array of user-platform associations
   */
  async findByUserId(userId: string): Promise<UserPlatform[]> {
    return await this.db
      .select()
      .from(userPlatforms)
      .where(eq(userPlatforms.userId, userId))
      .orderBy(userPlatforms.createdAt);
  }

  /**
   * Find a specific user-platform association
   *
   * @param userId - The user ID
   * @param platformId - The platform ID
   * @returns The user-platform association or null if not found
   */
  async findByUserAndPlatform(userId: string, platformId: string): Promise<UserPlatform | null> {
    const result = await this.db
      .select()
      .from(userPlatforms)
      .where(and(eq(userPlatforms.userId, userId), eq(userPlatforms.platformId, platformId)))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Create a new user-platform association
   *
   * @param userId - The user ID
   * @param data - The platform association data
   * @returns The created user-platform association
   * @throws ConflictError if the association already exists
   */
  async create(userId: string, data: CreateUserPlatformInput): Promise<UserPlatform> {
    try {
      const [created] = await this.db
        .insert(userPlatforms)
        .values({
          userId,
          platformId: data.platformId,
          username: data.username,
          iconUrl: data.iconUrl,
          profileUrl: data.profileUrl,
          notes: data.notes,
        })
        .returning();

      return created!;
    } catch (error) {
      // Catch PostgreSQL unique constraint violation (code 23505) and translate to ConflictError
      // Drizzle wraps DB errors, so check both direct code and message
      if (error instanceof Error) {
        const errorObj = error as { code?: string; cause?: { code?: string }; message?: string };
        const isUniqueViolation =
          errorObj.code === "23505" ||
          errorObj.cause?.code === "23505" ||
          errorObj.message?.includes("duplicate key") ||
          errorObj.message?.includes("unique");

        if (isUniqueViolation) {
          throw new ConflictError(`User already has platform ${data.platformId} associated`);
        }
      }
      throw error;
    }
  }

  /**
   * Update a user-platform association
   *
   * @param id - The user-platform association ID
   * @param data - The fields to update
   * @returns The updated user-platform association
   * @throws NotFoundError if the association does not exist
   */
  async update(id: string, data: UpdateUserPlatformInput): Promise<UserPlatform> {
    // Perform fully atomic update in a transaction: read current values, then update
    const updated = await this.db.transaction(async (tx) => {
      // Fetch current record within transaction to ensure atomicity
      const existing = await tx
        .select()
        .from(userPlatforms)
        .where(eq(userPlatforms.id, id))
        .limit(1);

      if (!existing.length) {
        throw new NotFoundError("UserPlatform", id);
      }

      const current = existing[0];

      // Update with preserved values for omitted fields
      const result = await tx
        .update(userPlatforms)
        .set({
          username: data.username ?? current.username,
          iconUrl: data.iconUrl ?? current.iconUrl,
          profileUrl: data.profileUrl ?? current.profileUrl,
          notes: data.notes ?? current.notes,
        })
        .where(eq(userPlatforms.id, id))
        .returning();

      if (!result.length) {
        throw new NotFoundError("UserPlatform", id);
      }

      return result[0];
    });

    return updated;
  }

  /**
   * Delete a user-platform association
   *
   * @param id - The user-platform association ID
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(userPlatforms).where(eq(userPlatforms.id, id));
  }

  /**
   * Delete all platform associations for a specific user
   *
   * @param userId - The user ID
   */
  async deleteByUserId(userId: string): Promise<void> {
    await this.db.delete(userPlatforms).where(eq(userPlatforms.userId, userId));
  }
}
