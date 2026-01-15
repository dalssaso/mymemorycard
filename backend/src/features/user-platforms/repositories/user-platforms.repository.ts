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
    // Check if association already exists
    const existing = await this.findByUserAndPlatform(userId, data.platformId);
    if (existing) {
      throw new ConflictError(`User already has platform ${data.platformId} associated`);
    }

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
    // Verify the record exists
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError("UserPlatform", id);
    }

    // Update only provided fields
    const [updated] = await this.db
      .update(userPlatforms)
      .set({
        username: data.username ?? existing.username,
        iconUrl: data.iconUrl ?? existing.iconUrl,
        profileUrl: data.profileUrl ?? existing.profileUrl,
        notes: data.notes ?? existing.notes,
      })
      .where(eq(userPlatforms.id, id))
      .returning();

    return updated!;
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
