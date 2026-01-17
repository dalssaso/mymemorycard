import { injectable, inject } from "tsyringe";
import { and, eq, inArray, sql } from "drizzle-orm";

import { DATABASE_TOKEN } from "@/container/tokens";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import {
  collectionGames,
  collections,
  completionLogs,
  games,
  platforms,
  playSessions,
  stores,
  userGameAdditions,
  userGameCustomFields,
  userGameDisplayEditions,
  userGameEditions,
  userGameProgress,
  userGames,
  userPlaytime,
} from "@/db/schema";
import { ConflictError, NotFoundError } from "@/shared/errors/base";
import type { UserGame, UserGameWithRelations } from "../types";
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
   * Find a user game entry by ID with related game, platform, and store.
   * @param id - User game ID
   * @returns User game with relations or null
   */
  async findByIdWithRelations(id: string): Promise<UserGameWithRelations | null> {
    const result = await this.db
      .select({
        id: userGames.id,
        userId: userGames.userId,
        gameId: userGames.gameId,
        platformId: userGames.platformId,
        storeId: userGames.storeId,
        platformGameId: userGames.platformGameId,
        owned: userGames.owned,
        purchasedDate: userGames.purchasedDate,
        importSource: userGames.importSource,
        createdAt: userGames.createdAt,
        gameName: games.name,
        gameCoverArtUrl: games.coverArtUrl,
        platformName: platforms.name,
        platformAbbreviation: platforms.abbreviation,
        storeSlug: stores.slug,
        storeDisplayName: stores.displayName,
      })
      .from(userGames)
      .innerJoin(games, eq(userGames.gameId, games.id))
      .innerJoin(platforms, eq(userGames.platformId, platforms.id))
      .leftJoin(stores, eq(userGames.storeId, stores.id))
      .where(eq(userGames.id, id))
      .limit(1);

    if (result.length === 0) return null;

    return this.mapToUserGameWithRelations(result[0]);
  }

  /**
   * List user game entries for a user with relations.
   * @param userId - User ID
   * @param skip - Pagination offset
   * @param take - Pagination limit
   * @returns Array of user games with relations
   */
  async listByUserWithRelations(
    userId: string,
    skip = 0,
    take = 50
  ): Promise<UserGameWithRelations[]> {
    const results = await this.db
      .select({
        id: userGames.id,
        userId: userGames.userId,
        gameId: userGames.gameId,
        platformId: userGames.platformId,
        storeId: userGames.storeId,
        platformGameId: userGames.platformGameId,
        owned: userGames.owned,
        purchasedDate: userGames.purchasedDate,
        importSource: userGames.importSource,
        createdAt: userGames.createdAt,
        gameName: games.name,
        gameCoverArtUrl: games.coverArtUrl,
        platformName: platforms.name,
        platformAbbreviation: platforms.abbreviation,
        storeSlug: stores.slug,
        storeDisplayName: stores.displayName,
      })
      .from(userGames)
      .innerJoin(games, eq(userGames.gameId, games.id))
      .innerJoin(platforms, eq(userGames.platformId, platforms.id))
      .leftJoin(stores, eq(userGames.storeId, stores.id))
      .where(eq(userGames.userId, userId))
      .offset(skip)
      .limit(take);

    return results.map((row) => this.mapToUserGameWithRelations(row));
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
    user_id: string;
    game_id: string;
    platform_id: string;
    store_id?: string;
    platform_game_id?: string;
    owned?: boolean;
    purchased_date?: Date;
    import_source?: string;
  }): Promise<UserGame> {
    try {
      const [created] = await this.db
        .insert(userGames)
        .values({
          userId: data.user_id,
          gameId: data.game_id,
          platformId: data.platform_id,
          storeId: data.store_id,
          platformGameId: data.platform_game_id,
          owned: data.owned ?? true,
          purchasedDate: data.purchased_date ? this.formatDateForDb(data.purchased_date) : null,
          importSource: data.import_source,
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
        throw new ConflictError(`User already owns game on platform ${data.platform_id}`);
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
   * @throws {ConflictError} If unique constraint violation
   */
  async update(
    id: string,
    userId: string,
    data: Partial<Omit<UserGame, "id" | "user_id" | "created_at">>
  ): Promise<UserGame> {
    try {
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
        .where(and(eq(userGames.id, id), eq(userGames.userId, userId)))
        .returning();

      if (result.length === 0) {
        throw new NotFoundError(`User game ${id} not found`);
      }

      return this.mapToUserGame(result[0]);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      const err = error as {
        code?: string;
        message?: string;
        cause?: { code?: string; message?: string };
      };
      const isUniqueViolation =
        err.code === "23505" ||
        err.cause?.code === "23505" ||
        err.message?.includes("23505") ||
        err.cause?.message?.includes("23505");
      if (isUniqueViolation) {
        throw new ConflictError(`User already owns game on this platform`);
      }
      throw error;
    }
  }

  /**
   * Delete a user game entry and all related data.
   * Cascades deletion to play sessions, completion logs, playtime, progress,
   * custom fields, display editions, edition ownership, DLC ownership, and
   * removes from collections if no other platforms remain.
   * @param id - User game ID
   * @param userId - User ID (for auth check)
   * @returns true if deleted
   * @throws {NotFoundError} If not found or access denied
   */
  async delete(id: string, userId: string): Promise<boolean> {
    // Delete in transaction for atomicity (including initial read to prevent TOCTOU)
    await this.db.transaction(async (tx) => {
      // 1. Get the user game inside transaction to retrieve gameId and platformId
      const userGame = await tx.query.userGames.findFirst({
        where: and(eq(userGames.id, id), eq(userGames.userId, userId)),
      });

      if (!userGame) {
        throw new NotFoundError("User game", id);
      }

      const gameId = userGame.gameId;
      const platformId = userGame.platformId;
      // Delete play sessions
      await tx
        .delete(playSessions)
        .where(
          and(
            eq(playSessions.userId, userId),
            eq(playSessions.gameId, gameId),
            eq(playSessions.platformId, platformId)
          )
        );

      // Delete completion logs
      await tx
        .delete(completionLogs)
        .where(
          and(
            eq(completionLogs.userId, userId),
            eq(completionLogs.gameId, gameId),
            eq(completionLogs.platformId, platformId)
          )
        );

      // Delete user playtime
      await tx
        .delete(userPlaytime)
        .where(
          and(
            eq(userPlaytime.userId, userId),
            eq(userPlaytime.gameId, gameId),
            eq(userPlaytime.platformId, platformId)
          )
        );

      // Delete user game progress
      await tx
        .delete(userGameProgress)
        .where(
          and(
            eq(userGameProgress.userId, userId),
            eq(userGameProgress.gameId, gameId),
            eq(userGameProgress.platformId, platformId)
          )
        );

      // Delete custom fields
      await tx
        .delete(userGameCustomFields)
        .where(
          and(
            eq(userGameCustomFields.userId, userId),
            eq(userGameCustomFields.gameId, gameId),
            eq(userGameCustomFields.platformId, platformId)
          )
        );

      // Delete display edition preferences
      await tx
        .delete(userGameDisplayEditions)
        .where(
          and(
            eq(userGameDisplayEditions.userId, userId),
            eq(userGameDisplayEditions.gameId, gameId),
            eq(userGameDisplayEditions.platformId, platformId)
          )
        );

      // Delete edition ownership
      await tx
        .delete(userGameEditions)
        .where(
          and(
            eq(userGameEditions.userId, userId),
            eq(userGameEditions.gameId, gameId),
            eq(userGameEditions.platformId, platformId)
          )
        );

      // Delete DLC ownership
      await tx
        .delete(userGameAdditions)
        .where(
          and(
            eq(userGameAdditions.userId, userId),
            eq(userGameAdditions.gameId, gameId),
            eq(userGameAdditions.platformId, platformId)
          )
        );

      // Delete the user_games entry
      await tx.delete(userGames).where(and(eq(userGames.id, id), eq(userGames.userId, userId)));

      // Check if user still owns the game on any other platform
      const remaining = await tx.query.userGames.findMany({
        where: and(eq(userGames.userId, userId), eq(userGames.gameId, gameId)),
      });

      // Remove from collections if no platforms remain
      if (remaining.length === 0) {
        const userCollections = await tx.query.collections.findMany({
          where: eq(collections.userId, userId),
          columns: { id: true },
        });
        const collectionIds = userCollections.map((c) => c.id);
        if (collectionIds.length > 0) {
          await tx
            .delete(collectionGames)
            .where(
              and(
                eq(collectionGames.gameId, gameId),
                inArray(collectionGames.collectionId, collectionIds)
              )
            );
        }
      }
    });

    return true;
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

  private mapToUserGameWithRelations(row: Record<string, unknown>): UserGameWithRelations {
    const base = this.mapToUserGame(row);
    return {
      ...base,
      game: {
        id: row.gameId as string,
        name: row.gameName as string,
        cover_art_url: (row.gameCoverArtUrl as string) || null,
      },
      platform: {
        id: row.platformId as string,
        name: row.platformName as string,
        abbreviation: (row.platformAbbreviation as string) || null,
      },
      store: row.storeId
        ? {
            id: row.storeId as string,
            slug: row.storeSlug as string,
            display_name: row.storeDisplayName as string,
          }
        : null,
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
