import type { achievements, userAchievements } from "@/db/schema"

/**
 * Drizzle-inferred types for achievements table.
 */
export type Achievement = typeof achievements.$inferSelect
export type NewAchievement = typeof achievements.$inferInsert

/**
 * Drizzle-inferred types for user_achievements table.
 */
export type UserAchievement = typeof userAchievements.$inferSelect
export type NewUserAchievement = typeof userAchievements.$inferInsert

/**
 * Achievement source API types.
 */
export type AchievementSourceApi = "steam" | "retroachievements" | "rawg" | "manual"

/**
 * Achievement with user unlock status.
 */
export interface AchievementWithStatus extends Achievement {
  /** Whether the user has unlocked this achievement */
  unlocked: boolean
  /** Date when the achievement was unlocked, if unlocked */
  unlock_date: Date | null
}

export interface IAchievementRepository {
  /**
   * Find achievements for a game on a specific platform.
   * @param gameId - Game ID (UUID)
   * @param platformId - Platform ID (UUID)
   * @returns Array of achievements
   */
  findByGameAndPlatform(gameId: string, platformId: string): Promise<Achievement[]>

  /**
   * Find achievements for a game from a specific source API.
   * @param gameId - Game ID (UUID)
   * @param sourceApi - Source API (steam, retroachievements, rawg, manual)
   * @returns Array of achievements
   */
  findByGameAndSource(gameId: string, sourceApi: AchievementSourceApi): Promise<Achievement[]>

  /**
   * Upsert multiple achievements (insert or update on conflict).
   * Uses (game_id, platform_id, achievement_id) as unique constraint.
   * @param achievements - Array of achievement data to upsert
   * @returns Array of upserted achievements
   */
  upsertMany(achievements: NewAchievement[]): Promise<Achievement[]>

  /**
   * Get achievements for a user's game with unlock status.
   * @param userId - User ID (UUID)
   * @param gameId - Game ID (UUID)
   * @param platformId - Platform ID (UUID)
   * @returns Array of achievements with unlock status
   */
  getUserAchievements(
    userId: string,
    gameId: string,
    platformId: string
  ): Promise<AchievementWithStatus[]>

  /**
   * Upsert a single user achievement record.
   * @param data - User achievement data
   * @returns Upserted user achievement
   */
  upsertUserAchievement(data: NewUserAchievement): Promise<UserAchievement>

  /**
   * Upsert multiple user achievement records.
   * @param data - Array of user achievement data
   * @returns Array of upserted user achievements
   */
  upsertUserAchievementsMany(data: NewUserAchievement[]): Promise<UserAchievement[]>

  /**
   * Count unlocked achievements for a user's game on a platform.
   * @param userId - User ID (UUID)
   * @param gameId - Game ID (UUID)
   * @param platformId - Platform ID (UUID)
   * @returns Number of unlocked achievements
   */
  countUnlocked(userId: string, gameId: string, platformId: string): Promise<number>

  /**
   * Count total achievements for a game on a platform.
   * @param gameId - Game ID (UUID)
   * @param platformId - Platform ID (UUID)
   * @returns Total number of achievements
   */
  countTotal(gameId: string, platformId: string): Promise<number>
}
