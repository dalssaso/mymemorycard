import type { AchievementSourceApi } from "../repositories/achievement.repository.interface";

/**
 * Achievement response with source info
 */
export interface AchievementResponse {
  source: AchievementSourceApi;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon_url: string | null;
    rarity_percentage: number | null;
    points: number | null;
    unlocked: boolean;
    unlock_date: string | null;
  }>;
  total: number;
  unlocked: number;
}

/**
 * Achievement service interface
 * Implements priority chain: Steam -> RetroAchievements -> RAWG
 */
export interface IAchievementService {
  /**
   * Get achievements for a game using priority chain.
   * Priority: Steam > RetroAchievements > RAWG > Manual
   * @param userId - User ID (UUID)
   * @param gameId - Game ID (UUID)
   * @returns Achievement response with source and achievement list
   * @throws {NotFoundError} If game not found
   */
  getAchievements(userId: string, gameId: string): Promise<AchievementResponse>;

  /**
   * Sync achievements from external source.
   * Fetches achievements from the specified source and stores them in the database.
   * @param userId - User ID (UUID)
   * @param gameId - Game ID (UUID)
   * @param source - Achievement source API to sync from
   * @returns Achievement response with synced achievements
   * @throws {NotFoundError} If game not found
   * @throws {ValidationError} If game does not have the required external ID for the source
   */
  syncAchievements(
    userId: string,
    gameId: string,
    source: AchievementSourceApi
  ): Promise<AchievementResponse>;

  /**
   * Get achievement progress summary.
   * Returns counts and completion percentage for a user's game achievements.
   * @param userId - User ID (UUID)
   * @param gameId - Game ID (UUID)
   * @returns Progress summary with unlocked count, total count, and percentage
   * @throws {NotFoundError} If game not found
   */
  getProgress(
    userId: string,
    gameId: string
  ): Promise<{ unlocked: number; total: number; percentage: number }>;
}
