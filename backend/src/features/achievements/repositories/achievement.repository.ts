import { injectable, inject } from "tsyringe"
import { and, eq, sql } from "drizzle-orm"

import { DATABASE_TOKEN } from "@/container/tokens"
import type { DrizzleDB } from "@/infrastructure/database/connection"
import { achievements, userAchievements } from "@/db/schema"
import type {
  Achievement,
  AchievementSourceApi,
  AchievementWithStatus,
  IAchievementRepository,
  NewAchievement,
  NewUserAchievement,
  UserAchievement,
} from "./achievement.repository.interface"

/**
 * PostgreSQL implementation of the AchievementRepository interface using Drizzle ORM.
 * Manages CRUD operations for game achievements and user achievement progress.
 */
@injectable()
export class AchievementRepository implements IAchievementRepository {
  constructor(@inject(DATABASE_TOKEN) private db: DrizzleDB) {}

  /**
   * Find achievements for a game on a specific platform.
   * @param gameId - Game ID (UUID)
   * @param platformId - Platform ID (UUID)
   * @returns Array of achievements
   */
  async findByGameAndPlatform(gameId: string, platformId: string): Promise<Achievement[]> {
    return this.db.query.achievements.findMany({
      where: and(eq(achievements.gameId, gameId), eq(achievements.platformId, platformId)),
    })
  }

  /**
   * Find achievements for a game from a specific source API.
   * @param gameId - Game ID (UUID)
   * @param sourceApi - Source API (steam, retroachievements, rawg, manual)
   * @returns Array of achievements
   */
  async findByGameAndSource(gameId: string, sourceApi: AchievementSourceApi): Promise<Achievement[]> {
    return this.db.query.achievements.findMany({
      where: and(eq(achievements.gameId, gameId), eq(achievements.sourceApi, sourceApi)),
    })
  }

  /**
   * Upsert multiple achievements (insert or update on conflict).
   * Uses (game_id, platform_id, achievement_id) as unique constraint.
   * @param achievementsData - Array of achievement data to upsert
   * @returns Array of upserted achievements
   */
  async upsertMany(achievementsData: NewAchievement[]): Promise<Achievement[]> {
    if (achievementsData.length === 0) {
      return []
    }

    return this.db
      .insert(achievements)
      .values(achievementsData)
      .onConflictDoUpdate({
        target: [achievements.gameId, achievements.platformId, achievements.achievementId],
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          iconUrl: sql`excluded.icon_url`,
          rarityPercentage: sql`excluded.rarity_percentage`,
          points: sql`excluded.points`,
          sourceApi: sql`excluded.source_api`,
          externalId: sql`excluded.external_id`,
          updatedAt: sql`now()`,
        },
      })
      .returning()
  }

  /**
   * Get achievements for a user's game with unlock status.
   * @param userId - User ID (UUID)
   * @param gameId - Game ID (UUID)
   * @param platformId - Platform ID (UUID)
   * @returns Array of achievements with unlock status
   */
  async getUserAchievements(
    userId: string,
    gameId: string,
    platformId: string
  ): Promise<AchievementWithStatus[]> {
    const results = await this.db
      .select({
        id: achievements.id,
        gameId: achievements.gameId,
        platformId: achievements.platformId,
        achievementId: achievements.achievementId,
        name: achievements.name,
        description: achievements.description,
        iconUrl: achievements.iconUrl,
        rarityPercentage: achievements.rarityPercentage,
        points: achievements.points,
        sourceApi: achievements.sourceApi,
        externalId: achievements.externalId,
        createdAt: achievements.createdAt,
        updatedAt: achievements.updatedAt,
        unlocked: userAchievements.unlocked,
        unlockDate: userAchievements.unlockDate,
      })
      .from(achievements)
      .leftJoin(
        userAchievements,
        and(
          eq(userAchievements.achievementId, achievements.id),
          eq(userAchievements.userId, userId)
        )
      )
      .where(and(eq(achievements.gameId, gameId), eq(achievements.platformId, platformId)))

    return results.map((row) => ({
      id: row.id,
      gameId: row.gameId,
      platformId: row.platformId,
      achievementId: row.achievementId,
      name: row.name,
      description: row.description,
      iconUrl: row.iconUrl,
      rarityPercentage: row.rarityPercentage,
      points: row.points,
      sourceApi: row.sourceApi,
      externalId: row.externalId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      unlocked: row.unlocked ?? false,
      unlock_date: row.unlockDate ?? null,
    }))
  }

  /**
   * Upsert a single user achievement record.
   * @param data - User achievement data
   * @returns Upserted user achievement
   */
  async upsertUserAchievement(data: NewUserAchievement): Promise<UserAchievement> {
    const [result] = await this.db
      .insert(userAchievements)
      .values(data)
      .onConflictDoUpdate({
        target: [userAchievements.userId, userAchievements.achievementId],
        set: {
          unlocked: sql`excluded.unlocked`,
          unlockDate: sql`excluded.unlock_date`,
        },
      })
      .returning()

    return result
  }

  /**
   * Upsert multiple user achievement records.
   * @param data - Array of user achievement data
   * @returns Array of upserted user achievements
   */
  async upsertUserAchievementsMany(data: NewUserAchievement[]): Promise<UserAchievement[]> {
    if (data.length === 0) {
      return []
    }

    return this.db
      .insert(userAchievements)
      .values(data)
      .onConflictDoUpdate({
        target: [userAchievements.userId, userAchievements.achievementId],
        set: {
          unlocked: sql`excluded.unlocked`,
          unlockDate: sql`excluded.unlock_date`,
        },
      })
      .returning()
  }

  /**
   * Count unlocked achievements for a user's game on a platform.
   * @param userId - User ID (UUID)
   * @param gameId - Game ID (UUID)
   * @param platformId - Platform ID (UUID)
   * @returns Number of unlocked achievements
   */
  async countUnlocked(userId: string, gameId: string, platformId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(achievements.gameId, gameId),
          eq(achievements.platformId, platformId),
          eq(userAchievements.unlocked, true)
        )
      )

    return result[0]?.count ?? 0
  }

  /**
   * Count total achievements for a game on a platform.
   * @param gameId - Game ID (UUID)
   * @param platformId - Platform ID (UUID)
   * @returns Total number of achievements
   */
  async countTotal(gameId: string, platformId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(achievements)
      .where(and(eq(achievements.gameId, gameId), eq(achievements.platformId, platformId)))

    return result[0]?.count ?? 0
  }
}
