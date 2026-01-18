import { injectable, inject } from "tsyringe";
import { and, eq, sql } from "drizzle-orm";

import { DATABASE_TOKEN } from "@/container/tokens";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import { userGameProgress, userGameCustomFields } from "@/db/schema";
import { ConflictError } from "@/shared/errors/base";
import type { GameStatus } from "../dtos/user-game-progress.dto";
import type {
  IUserGameProgressRepository,
  UserGameProgress,
  UserGameCustomFields,
} from "./user-game-progress.repository.interface";

/**
 * PostgreSQL implementation of the UserGameProgressRepository interface using Drizzle ORM.
 * Manages progress tracking operations for user games (status, rating, notes, favorites, custom fields).
 */
@injectable()
export class UserGameProgressRepository implements IUserGameProgressRepository {
  constructor(@inject(DATABASE_TOKEN) private db: DrizzleDB) {}

  /**
   * Find progress record for a specific game and platform
   * @param userId - User ID
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @returns Progress record or null if not found
   */
  async findByGameAndPlatform(
    userId: string,
    gameId: string,
    platformId: string
  ): Promise<UserGameProgress | null> {
    const result = await this.db.query.userGameProgress.findFirst({
      where: and(
        eq(userGameProgress.userId, userId),
        eq(userGameProgress.gameId, gameId),
        eq(userGameProgress.platformId, platformId)
      ),
    });

    return result ? this.mapToUserGameProgress(result) : null;
  }

  /**
   * Update the status for a game on a specific platform
   * @param userId - User ID
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @param status - New status
   * @throws {ConflictError} If constraint violation occurs
   */
  async updateStatus(
    userId: string,
    gameId: string,
    platformId: string,
    status: GameStatus
  ): Promise<void> {
    const now = sql`NOW()`;
    const updateData: Record<string, unknown> = {
      status,
    };

    // Set startedAt when status is "playing" (preserve existing value if already set)
    if (status === "playing") {
      updateData.startedAt = sql`COALESCE(${userGameProgress.startedAt}, NOW())`;
    }

    // Set completedAt when status is "finished" or "completed" (preserve existing value if already set)
    if (status === "finished" || status === "completed") {
      updateData.completedAt = sql`COALESCE(${userGameProgress.completedAt}, NOW())`;
    }

    try {
      await this.db
        .insert(userGameProgress)
        .values({
          userId,
          gameId,
          platformId,
          status,
          startedAt: status === "playing" ? now : null,
          completedAt: status === "finished" || status === "completed" ? now : null,
        })
        .onConflictDoUpdate({
          target: [userGameProgress.userId, userGameProgress.gameId, userGameProgress.platformId],
          set: updateData,
        });
    } catch (err) {
      this.handleConstraintError(err);
      throw err;
    }
  }

  /**
   * Update the user rating for a game on a specific platform
   * @param userId - User ID
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @param rating - New rating (1-10)
   * @throws {ConflictError} If constraint violation occurs
   */
  async updateRating(
    userId: string,
    gameId: string,
    platformId: string,
    rating: number
  ): Promise<void> {
    try {
      await this.db
        .insert(userGameProgress)
        .values({
          userId,
          gameId,
          platformId,
          userRating: rating,
        })
        .onConflictDoUpdate({
          target: [userGameProgress.userId, userGameProgress.gameId, userGameProgress.platformId],
          set: { userRating: rating },
        });
    } catch (err) {
      this.handleConstraintError(err);
      throw err;
    }
  }

  /**
   * Update notes for a game on a specific platform
   * @param userId - User ID
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @param notes - New notes
   * @throws {ConflictError} If constraint violation occurs
   */
  async updateNotes(
    userId: string,
    gameId: string,
    platformId: string,
    notes: string
  ): Promise<void> {
    try {
      await this.db
        .insert(userGameProgress)
        .values({
          userId,
          gameId,
          platformId,
          notes,
        })
        .onConflictDoUpdate({
          target: [userGameProgress.userId, userGameProgress.gameId, userGameProgress.platformId],
          set: { notes },
        });
    } catch (err) {
      this.handleConstraintError(err);
      throw err;
    }
  }

  /**
   * Update favorite status for a game on a specific platform
   * @param userId - User ID
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @param isFavorite - New favorite status
   * @throws {ConflictError} If constraint violation occurs
   */
  async updateFavorite(
    userId: string,
    gameId: string,
    platformId: string,
    isFavorite: boolean
  ): Promise<void> {
    try {
      await this.db
        .insert(userGameProgress)
        .values({
          userId,
          gameId,
          platformId,
          isFavorite,
        })
        .onConflictDoUpdate({
          target: [userGameProgress.userId, userGameProgress.gameId, userGameProgress.platformId],
          set: { isFavorite },
        });
    } catch (err) {
      this.handleConstraintError(err);
      throw err;
    }
  }

  /**
   * Get custom fields for a game on a specific platform
   * @param userId - User ID
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @returns Custom fields or null if not found
   */
  async getCustomFields(
    userId: string,
    gameId: string,
    platformId: string
  ): Promise<UserGameCustomFields | null> {
    const result = await this.db.query.userGameCustomFields.findFirst({
      where: and(
        eq(userGameCustomFields.userId, userId),
        eq(userGameCustomFields.gameId, gameId),
        eq(userGameCustomFields.platformId, platformId)
      ),
    });

    return result ? this.mapToUserGameCustomFields(result) : null;
  }

  /**
   * Update custom fields for a game on a specific platform
   * @param userId - User ID
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @param fields - Fields to update
   * @throws {ConflictError} If constraint violation occurs
   */
  async updateCustomFields(
    userId: string,
    gameId: string,
    platformId: string,
    fields: { completion_percentage?: number; difficulty_rating?: number }
  ): Promise<void> {
    const now = sql`NOW()`;
    const updateData: Record<string, unknown> = {
      updatedAt: now,
    };

    if (fields.completion_percentage !== undefined) {
      updateData.completionPercentage = fields.completion_percentage;
    }
    if (fields.difficulty_rating !== undefined) {
      updateData.difficultyRating = fields.difficulty_rating;
    }

    try {
      await this.db
        .insert(userGameCustomFields)
        .values({
          userId,
          gameId,
          platformId,
          completionPercentage: fields.completion_percentage ?? null,
          difficultyRating: fields.difficulty_rating ?? null,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            userGameCustomFields.userId,
            userGameCustomFields.gameId,
            userGameCustomFields.platformId,
          ],
          set: updateData,
        });
    } catch (err) {
      this.handleConstraintError(err);
      throw err;
    }
  }

  private mapToUserGameProgress(row: Record<string, unknown>): UserGameProgress {
    return {
      user_id: row.userId as string,
      game_id: row.gameId as string,
      platform_id: row.platformId as string,
      status: (row.status as GameStatus) || null,
      user_rating: (row.userRating as number) ?? null,
      notes: (row.notes as string) ?? null,
      is_favorite: (row.isFavorite as boolean) ?? false,
      started_at: this.ensureDate(row.startedAt),
      completed_at: this.ensureDate(row.completedAt),
    };
  }

  private mapToUserGameCustomFields(row: Record<string, unknown>): UserGameCustomFields {
    return {
      user_id: row.userId as string,
      game_id: row.gameId as string,
      platform_id: row.platformId as string,
      completion_percentage: (row.completionPercentage as number) ?? null,
      difficulty_rating: (row.difficultyRating as number) ?? null,
      updated_at: this.ensureDate(row.updatedAt),
    };
  }

  private ensureDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string") return new Date(value);
    return null;
  }

  /**
   * Handle database constraint errors and translate to domain errors
   * @param err - Error to check
   * @throws {ConflictError} If unique or foreign key constraint violation
   */
  private handleConstraintError(err: unknown): void {
    const error = err as Record<string, unknown>;
    const cause = error.cause as Record<string, unknown> | undefined;

    const isUniqueViolation =
      error.code === "23505" ||
      cause?.code === "23505" ||
      (typeof error.message === "string" && error.message.includes("23505"));

    const isFkViolation =
      error.code === "23503" ||
      cause?.code === "23503" ||
      (typeof error.message === "string" && error.message.includes("23503"));

    if (isUniqueViolation) {
      throw new ConflictError("User game progress");
    }

    if (isFkViolation) {
      throw new ConflictError("User game progress - invalid reference");
    }
  }
}
