import { injectable, inject } from "tsyringe";
import { and, eq, sql } from "drizzle-orm";

import { DATABASE_TOKEN } from "@/container/tokens";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import { userGames } from "@/db/schema";
import { ConflictError, NotFoundError } from "@/shared/errors/base";
import type { UserGame } from "../types";
import type { IUserGameRepository } from "./user-game.repository.interface";

/**
 * PostgreSQL implementation of the UserGameRepository interface using Drizzle ORM.
 * Manages CRUD operations for user library entries (games owned on specific platforms).
 */
@injectable()
export class UserGameRepository implements IUserGameRepository {
  constructor(@inject(DATABASE_TOKEN) private db: DrizzleDB) {}

  /**
   * Find a user game entry by ID.
   * @param id - User game ID
   * @returns User game or null
   */
  async findById(id: string): Promise<UserGame | null> {
    const result = await this.db.query.userGames.findFirst({
      where: eq(userGames.id, id),
    });
    return result ? this.mapToUserGame(result) : null;
  }

  /**
   * Find a user game by user, game, and platform.
   * @param userId - User ID
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @returns User game or null
   */
  async findByUserGamePlatform(
    userId: string,
    gameId: string,
    platformId: string
  ): Promise<UserGame | null> {
    const result = await this.db.query.userGames.findFirst({
      where: and(
        eq(userGames.userId, userId),
        eq(userGames.gameId, gameId),
        eq(userGames.platformId, platformId)
      ),
    });
    return result ? this.mapToUserGame(result) : null;
  }

  /**
   * Create a user game entry.
   * @param data - Entry data
   * @returns Created user game
   * @throws {ConflictError} If entry already exists
   */
  async create(data: {
    userId: string;
    gameId: string;
    platformId: string;
    storeId?: string;
    platformGameId?: string;
    owned?: boolean;
    purchasedDate?: Date;
    importSource?: string;
  }): Promise<UserGame> {
    try {
      const [created] = await this.db
        .insert(userGames)
        .values({
          userId: data.userId,
          gameId: data.gameId,
          platformId: data.platformId,
          storeId: data.storeId,
          platformGameId: data.platformGameId,
          owned: data.owned ?? true,
          purchasedDate: data.purchasedDate ? this.formatDateForDb(data.purchasedDate) : null,
          importSource: data.importSource,
        })
        .returning();

      return this.mapToUserGame(created!);
    } catch (error) {
      const err = error as Record<string, unknown> & {
        code?: string;
        cause?: Record<string, unknown>;
        message?: string;
      };
      const isUniqueViolation =
        err.code === "23505" ||
        (err.cause && (err.cause as Record<string, unknown>).code === "23505") ||
        (typeof err.message === "string" && err.message.includes("23505"));

      if (isUniqueViolation) {
        throw new ConflictError(`User already owns game on platform ${data.platformId}`);
      }
      throw error;
    }
  }

  /**
   * Update a user game entry.
   * @param id - User game ID
   * @param userId - User ID (for auth check)
   * @param data - Partial data
   * @returns Updated user game
   * @throws {NotFoundError} If not found or access denied
   */
  async update(
    id: string,
    userId: string,
    data: Partial<Omit<UserGame, "id" | "user_id" | "created_at">>
  ): Promise<UserGame> {
    const existing = await this.findById(id);
    if (!existing || existing.user_id !== userId) {
      throw new NotFoundError(`User game ${id} not found`);
    }

    const result = await this.db
      .update(userGames)
      .set({
        ...(data.game_id !== undefined && { gameId: data.game_id }),
        ...(data.platform_id !== undefined && {
          platformId: data.platform_id,
        }),
        ...(data.store_id !== undefined && { storeId: data.store_id }),
        ...(data.platform_game_id !== undefined && {
          platformGameId: data.platform_game_id,
        }),
        ...(data.owned !== undefined && { owned: data.owned }),
        ...(data.purchased_date !== undefined && {
          purchasedDate: data.purchased_date ? this.formatDateForDb(data.purchased_date) : null,
        }),
        ...(data.import_source !== undefined && {
          importSource: data.import_source,
        }),
      })
      .where(eq(userGames.id, id))
      .returning();

    return this.mapToUserGame(result[0]);
  }

  /**
   * Delete a user game entry.
   * @param id - User game ID
   * @param userId - User ID (for auth check)
   * @returns true if deleted
   * @throws {NotFoundError} If not found or access denied
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing || existing.user_id !== userId) {
      throw new NotFoundError(`User game ${id} not found`);
    }

    const result = await this.db.delete(userGames).where(eq(userGames.id, id)).returning();

    return result.length > 0;
  }

  /**
   * List user game entries for a user.
   * @param userId - User ID
   * @param skip - Pagination offset
   * @param take - Pagination limit
   * @returns Array of user games
   */
  async listByUser(userId: string, skip = 0, take = 50): Promise<UserGame[]> {
    const results = await this.db.query.userGames.findMany({
      where: eq(userGames.userId, userId),
      offset: skip,
      limit: take,
    });
    return results.map((row) => this.mapToUserGame(row));
  }

  /**
   * Get user game entries for a specific game.
   * @param userId - User ID
   * @param gameId - Game ID
   * @returns Array (user may own on multiple platforms)
   */
  async getByGameForUser(userId: string, gameId: string): Promise<UserGame[]> {
    const results = await this.db.query.userGames.findMany({
      where: and(eq(userGames.userId, userId), eq(userGames.gameId, gameId)),
    });
    return results.map((row) => this.mapToUserGame(row));
  }

  /**
   * Delete all user game entries for a user (used in cleanup).
   * @param userId - User ID
   * @returns Count of deleted records
   */
  async deleteAllByUser(userId: string): Promise<number> {
    const result = await this.db.delete(userGames).where(eq(userGames.userId, userId)).returning();

    return result.length;
  }

  /**
   * Count user games for a user.
   * @param userId - User ID
   * @returns Total count
   */
  async countByUser(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(userGames)
      .where(eq(userGames.userId, userId));

    return result[0]?.count ?? 0;
  }

  private mapToUserGame(row: Record<string, unknown>): UserGame {
    return {
      id: row.id as string,
      user_id: row.userId as string,
      game_id: row.gameId as string,
      platform_id: row.platformId as string,
      store_id: (row.storeId as string) || null,
      platform_game_id: (row.platformGameId as string) || null,
      owned: (row.owned as boolean) ?? true,
      purchased_date: this.ensureDate(row.purchasedDate),
      import_source: (row.importSource as string) || null,
      created_at: this.ensureDate(row.createdAt) as Date,
    };
  }

  private ensureDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string") return new Date(`${value}T00:00:00Z`);
    return null;
  }

  private formatDateForDb(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}
