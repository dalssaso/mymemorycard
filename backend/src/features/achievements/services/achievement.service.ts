import { inject, injectable } from "tsyringe";

import {
  ACHIEVEMENT_REPOSITORY_TOKEN,
  GAME_REPOSITORY_TOKEN,
  GAMES_PLATFORM_REPOSITORY_TOKEN,
  RETROACHIEVEMENTS_SERVICE_TOKEN,
  STEAM_SERVICE_TOKEN,
} from "@/container/tokens";
import type { IGameRepository } from "@/features/games/repositories/game.repository.interface";
import type { IPlatformRepository } from "@/features/games/repositories/platform.repository.interface";
import type { IRetroAchievementsService } from "@/integrations/retroachievements/retroachievements.service.interface";
import type { ISteamService } from "@/integrations/steam/steam.service.interface";
import type { NormalizedAchievement } from "../types";
import { Logger } from "@/infrastructure/logging/logger";
import { NotFoundError, ValidationError } from "@/shared/errors/base";

import type {
  AchievementSourceApi,
  IAchievementRepository,
  NewAchievement,
  NewUserAchievement,
} from "../repositories/achievement.repository.interface";
import type { AchievementResponse, IAchievementService } from "./achievement.service.interface";

/**
 * IGDB platform ID for PC (Windows) - used for Steam achievements
 */
const PC_PLATFORM_IGDB_ID = 6;

/**
 * Achievement service implementation.
 * Implements priority chain: Steam -> RetroAchievements -> cached/manual
 */
@injectable()
export class AchievementService implements IAchievementService {
  private logger: Logger;

  constructor(
    @inject(ACHIEVEMENT_REPOSITORY_TOKEN)
    private achievementRepository: IAchievementRepository,
    @inject(GAME_REPOSITORY_TOKEN)
    private gameRepository: IGameRepository,
    @inject(GAMES_PLATFORM_REPOSITORY_TOKEN)
    private platformRepository: IPlatformRepository,
    @inject(STEAM_SERVICE_TOKEN)
    private steamService: ISteamService,
    @inject(RETROACHIEVEMENTS_SERVICE_TOKEN)
    private retroAchievementsService: IRetroAchievementsService,
    @inject(Logger) parentLogger: Logger
  ) {
    this.logger = parentLogger.child("AchievementService");
  }

  /**
   * Get achievements for a game using priority chain.
   * Priority: Steam > RetroAchievements > cached/manual
   * @param userId - User ID (UUID)
   * @param gameId - Game ID (UUID)
   * @returns Achievement response with source and achievement list
   * @throws {NotFoundError} If game not found
   */
  async getAchievements(userId: string, gameId: string): Promise<AchievementResponse> {
    this.logger.debug("Getting achievements", { userId, gameId });

    const game = await this.gameRepository.findById(gameId);
    if (!game) {
      throw new NotFoundError("Game", gameId);
    }

    // Priority 1: Try Steam if game has steam_app_id
    if (game.steam_app_id) {
      this.logger.debug("Attempting Steam achievements", { steamAppId: game.steam_app_id });
      try {
        const response = await this.syncAchievements(userId, gameId, "steam");
        return response;
      } catch (error) {
        this.logger.debug("Steam achievements not available, trying next source", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Priority 2: Try RetroAchievements if game has retro_game_id
    if (game.retro_game_id) {
      this.logger.debug("Attempting RetroAchievements", { retroGameId: game.retro_game_id });
      try {
        const response = await this.syncAchievements(userId, gameId, "retroachievements");
        return response;
      } catch (error) {
        this.logger.debug("RetroAchievements not available, falling back to cached", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Priority 3: Fall back to cached/manual achievements
    return this.getCachedAchievements(userId, gameId);
  }

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
  async syncAchievements(
    userId: string,
    gameId: string,
    source: AchievementSourceApi
  ): Promise<AchievementResponse> {
    this.logger.info("Syncing achievements", { userId, gameId, source });

    const game = await this.gameRepository.findById(gameId);
    if (!game) {
      throw new NotFoundError("Game", gameId);
    }

    let normalizedAchievements: NormalizedAchievement[] = [];
    let platformId: string;

    switch (source) {
      case "steam": {
        if (!game.steam_app_id) {
          throw new ValidationError("Game does not have a Steam App ID");
        }
        const pcPlatform = await this.platformRepository.findByIgdbId(PC_PLATFORM_IGDB_ID);
        if (!pcPlatform) {
          throw new ValidationError("PC platform not found in database");
        }
        platformId = pcPlatform.id;

        // Get achievements from Steam using the new method that resolves credentials internally
        normalizedAchievements = await this.steamService.getAchievementsForUser(
          userId,
          game.steam_app_id
        );
        this.logger.debug("Steam achievements fetched", { count: normalizedAchievements.length });
        break;
      }

      case "retroachievements": {
        if (!game.retro_game_id) {
          throw new ValidationError("Game does not have a RetroAchievements game ID");
        }
        // RetroAchievements games can be on various platforms, but we'll use a generic approach
        // For now, use the first available platform or create a generic one
        const existingAchievements = await this.achievementRepository.findByGameAndSource(
          gameId,
          "retroachievements"
        );
        if (existingAchievements.length > 0) {
          platformId = existingAchievements[0].platformId;
        } else {
          // For new RetroAchievements, we need to determine the platform
          // This could be improved with a platform mapping table
          const platforms = await this.platformRepository.list();
          const retroPlatform = platforms.find(
            (p) => p.platform_family === "retro" || p.name.toLowerCase().includes("retro")
          );
          platformId = retroPlatform?.id ?? platforms[0]?.id;
          if (!platformId) {
            throw new ValidationError("No platform available for RetroAchievements");
          }
        }

        normalizedAchievements = await this.retroAchievementsService.getAchievements(
          game.retro_game_id,
          userId
        );
        break;
      }

      case "rawg":
      case "manual":
        throw new ValidationError(`Sync not supported for source: ${source}`);

      default:
        throw new ValidationError(`Unknown achievement source: ${source}`);
    }

    // Store achievements in database
    if (normalizedAchievements.length > 0) {
      await this.storeAchievements(gameId, platformId, source, normalizedAchievements, userId);
    }

    // Return formatted response
    return this.formatResponse(
      source,
      normalizedAchievements,
      normalizedAchievements.filter((a) => a.unlocked).length
    );
  }

  /**
   * Get achievement progress summary.
   * Returns counts and completion percentage for a user's game achievements.
   * @param userId - User ID (UUID)
   * @param gameId - Game ID (UUID)
   * @returns Progress summary with unlocked count, total count, and percentage
   * @throws {NotFoundError} If game not found
   */
  async getProgress(
    userId: string,
    gameId: string
  ): Promise<{ unlocked: number; total: number; percentage: number }> {
    this.logger.debug("Getting achievement progress", { userId, gameId });

    const game = await this.gameRepository.findById(gameId);
    if (!game) {
      throw new NotFoundError("Game", gameId);
    }

    // Get the platform ID for this game's achievements
    // Try Steam first, then RetroAchievements
    let platformId: string | null = null;

    if (game.steam_app_id) {
      const pcPlatform = await this.platformRepository.findByIgdbId(PC_PLATFORM_IGDB_ID);
      platformId = pcPlatform?.id ?? null;
    }

    if (!platformId && game.retro_game_id) {
      const existingAchievements = await this.achievementRepository.findByGameAndSource(
        gameId,
        "retroachievements"
      );
      if (existingAchievements.length > 0) {
        platformId = existingAchievements[0].platformId;
      }
    }

    if (!platformId) {
      // No achievements tracked for this game
      return { unlocked: 0, total: 0, percentage: 0 };
    }

    const [unlocked, total] = await Promise.all([
      this.achievementRepository.countUnlocked(userId, gameId, platformId),
      this.achievementRepository.countTotal(gameId, platformId),
    ]);

    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

    return { unlocked, total, percentage };
  }

  /**
   * Store achievements and user unlock status in the database.
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @param source - Achievement source API
   * @param achievements - Normalized achievements to store
   * @param userId - User ID for unlock status
   */
  private async storeAchievements(
    gameId: string,
    platformId: string,
    source: AchievementSourceApi,
    achievements: NormalizedAchievement[],
    userId: string
  ): Promise<void> {
    this.logger.debug("Storing achievements", {
      gameId,
      platformId,
      source,
      count: achievements.length,
    });

    // Prepare achievement records
    const achievementRecords: NewAchievement[] = achievements.map((ach) => ({
      gameId,
      platformId,
      achievementId: ach.achievement_id,
      name: ach.name,
      description: ach.description,
      iconUrl: ach.icon_url || null,
      rarityPercentage: ach.rarity_percentage ?? null,
      points: null, // Steam doesn't have points, RA does
      sourceApi: source,
      externalId: ach.achievement_id,
    }));

    // Upsert achievements
    const storedAchievements = await this.achievementRepository.upsertMany(achievementRecords);

    // Create a map of achievement_id to stored record ID
    const achievementIdMap = new Map(storedAchievements.map((a) => [a.achievementId, a.id]));

    // Prepare user achievement records for unlocked achievements
    const userAchievementRecords: NewUserAchievement[] = achievements
      .filter((ach) => achievementIdMap.has(ach.achievement_id))
      .map((ach) => ({
        userId,
        achievementId: achievementIdMap.get(ach.achievement_id)!,
        unlocked: ach.unlocked,
        unlockDate: ach.unlock_time ?? null,
      }));

    // Upsert user achievements
    if (userAchievementRecords.length > 0) {
      await this.achievementRepository.upsertUserAchievementsMany(userAchievementRecords);
    }

    this.logger.info("Achievements stored successfully", {
      gameId,
      stored: storedAchievements.length,
      userUnlocks: userAchievementRecords.filter((r) => r.unlocked).length,
    });
  }

  /**
   * Get cached achievements from database (fallback when external APIs unavailable).
   * @param userId - User ID
   * @param gameId - Game ID
   * @returns Achievement response from cached data
   */
  private async getCachedAchievements(
    userId: string,
    gameId: string
  ): Promise<AchievementResponse> {
    this.logger.debug("Getting cached achievements", { userId, gameId });

    // Try to find any cached achievements for this game
    const sources: AchievementSourceApi[] = ["steam", "retroachievements", "rawg", "manual"];

    for (const source of sources) {
      const achievements = await this.achievementRepository.findByGameAndSource(gameId, source);
      if (achievements.length > 0) {
        // Get user achievements with unlock status
        const userAchievements = await this.achievementRepository.getUserAchievements(
          userId,
          gameId,
          achievements[0].platformId
        );

        return this.formatResponseFromDb(source, userAchievements);
      }
    }

    // No cached achievements found
    return {
      source: "manual",
      achievements: [],
      total: 0,
      unlocked: 0,
    };
  }

  /**
   * Format normalized achievements into API response.
   * @param source - Achievement source
   * @param achievements - Normalized achievements
   * @param unlockedCount - Number of unlocked achievements
   * @returns Formatted achievement response
   */
  private formatResponse(
    source: AchievementSourceApi,
    achievements: NormalizedAchievement[],
    unlockedCount: number
  ): AchievementResponse {
    return {
      source,
      achievements: achievements.map((ach) => ({
        id: ach.achievement_id,
        name: ach.name,
        description: ach.description,
        icon_url: ach.icon_url || null,
        rarity_percentage: ach.rarity_percentage,
        points: null,
        unlocked: ach.unlocked,
        unlock_date: ach.unlock_time?.toISOString() ?? null,
      })),
      total: achievements.length,
      unlocked: unlockedCount,
    };
  }

  /**
   * Format database achievements into API response.
   * @param source - Achievement source
   * @param achievements - Achievements with status from database
   * @returns Formatted achievement response
   */
  private formatResponseFromDb(
    source: AchievementSourceApi,
    achievements: Array<{
      id: string;
      achievementId: string;
      name: string | null;
      description: string | null;
      iconUrl: string | null;
      rarityPercentage: number | null;
      points: number | null;
      unlocked: boolean;
      unlockDate: Date | null;
    }>
  ): AchievementResponse {
    const unlocked = achievements.filter((a) => a.unlocked).length;

    return {
      source,
      achievements: achievements.map((ach) => ({
        id: ach.achievementId,
        name: ach.name ?? "Unknown",
        description: ach.description ?? "",
        icon_url: ach.iconUrl,
        rarity_percentage: ach.rarityPercentage,
        points: ach.points,
        unlocked: ach.unlocked,
        unlock_date: ach.unlockDate?.toISOString() ?? null,
      })),
      total: achievements.length,
      unlocked,
    };
  }
}
