import {
  buildAuthorization,
  getGameInfoAndUserProgress,
  getUserProfile as raGetUserProfile,
} from "@retroachievements/api";
import { inject, injectable } from "tsyringe";

import {
  ACHIEVEMENT_REPOSITORY_TOKEN,
  ENCRYPTION_SERVICE_TOKEN,
  GAME_REPOSITORY_TOKEN,
  GAMES_PLATFORM_REPOSITORY_TOKEN,
  USER_CREDENTIAL_REPOSITORY_TOKEN,
  USER_GAME_REPOSITORY_TOKEN,
} from "@/container/tokens";
import type {
  IAchievementRepository,
  NewAchievement,
} from "@/features/achievements/repositories/achievement.repository.interface";
import type { IUserCredentialRepository } from "@/features/credentials/repositories/user-credential.repository.interface";
import type { IEncryptionService } from "@/features/credentials/services/encryption.service.interface";
import type { IGameRepository } from "@/features/games/repositories/game.repository.interface";
import type { IPlatformRepository } from "@/features/games/repositories/platform.repository.interface";
import type { IUserGameRepository } from "@/features/games/repositories/user-game.repository.interface";
import { Logger } from "@/infrastructure/logging/logger";
import type { NormalizedAchievement } from "@/features/achievements/types";
import { NotFoundError, ValidationError } from "@/shared/errors/base";

import type { IRetroAchievementsService } from "./retroachievements.service.interface";
import type {
  RACredentials,
  RAGameInfo,
  RASyncResult,
  RAUserProfile,
} from "./retroachievements.types";

/**
 * RetroAchievements service implementation.
 * Provides integration with RetroAchievements API for retro game achievement tracking.
 */
@injectable()
export class RetroAchievementsService implements IRetroAchievementsService {
  private readonly logger: Logger;

  constructor(
    @inject(USER_CREDENTIAL_REPOSITORY_TOKEN)
    private readonly credentialRepository: IUserCredentialRepository,
    @inject(ENCRYPTION_SERVICE_TOKEN)
    private readonly encryptionService: IEncryptionService,
    @inject(GAME_REPOSITORY_TOKEN)
    private readonly gameRepository: IGameRepository,
    @inject(ACHIEVEMENT_REPOSITORY_TOKEN)
    private readonly achievementRepository: IAchievementRepository,
    @inject(GAMES_PLATFORM_REPOSITORY_TOKEN)
    private readonly platformRepository: IPlatformRepository,
    @inject(USER_GAME_REPOSITORY_TOKEN)
    private readonly userGameRepository: IUserGameRepository,
    @inject(Logger) parentLogger: Logger
  ) {
    this.logger = parentLogger.child("RetroAchievementsService");
  }

  /**
   * Validate RetroAchievements credentials by making a test API call.
   * @param credentials - Username and API key to validate
   * @returns true if credentials are valid
   */
  async validateCredentials(credentials: RACredentials): Promise<boolean> {
    try {
      const authorization = buildAuthorization({
        username: credentials.username,
        webApiKey: credentials.api_key,
      });

      const profile = await raGetUserProfile(authorization, {
        username: credentials.username,
      });

      return profile !== null && profile.user === credentials.username;
    } catch (error) {
      const errorInfo = error instanceof Error ? error.message : "unknown error";
      this.logger.warn("RetroAchievements credential validation failed", { error: errorInfo });
      return false;
    }
  }

  /**
   * Save RetroAchievements credentials for a user after validation.
   * @param userId - User ID
   * @param credentials - Username and API key
   * @throws ValidationError if credentials are invalid
   */
  async saveCredentials(userId: string, credentials: RACredentials): Promise<void> {
    const isValid = await this.validateCredentials(credentials);
    if (!isValid) {
      throw new ValidationError("Invalid RetroAchievements credentials");
    }

    const encrypted = this.encryptionService.encrypt(credentials);
    await this.credentialRepository.upsert(userId, {
      service: "retroachievements",
      credentialType: "api_key",
      encryptedCredentials: encrypted,
      isActive: true,
      hasValidToken: true,
    });

    this.logger.info("RetroAchievements credentials saved", { userId });
  }

  /**
   * Get user profile from RetroAchievements.
   * @param userId - User ID in our system
   * @returns User profile or null if unavailable
   */
  async getUserProfile(userId: string): Promise<RAUserProfile | null> {
    const { authorization, credentials } = await this.getAuthAndCredentials(userId);

    try {
      const profile = await raGetUserProfile(authorization, {
        username: credentials.username,
      });

      if (!profile) {
        return null;
      }

      // Map the camelCase API response to our RAUserProfile type
      return {
        user: profile.user,
        userPic: profile.userPic,
        memberSince: profile.memberSince,
        richPresenceMsg: profile.richPresenceMsg ?? "",
        lastGameID: profile.lastGameId,
        contribCount: profile.contribCount,
        contribYield: profile.contribYield,
        totalPoints: profile.totalPoints,
        totalSoftcorePoints: profile.totalSoftcorePoints,
        totalTruePoints: profile.totalTruePoints,
        permissions: profile.permissions,
        untracked: profile.untracked,
        id: profile.id,
        userWallActive: profile.userWallActive,
        motto: profile.motto,
      };
    } catch (error) {
      const errorInfo = error instanceof Error ? error.message : "unknown error";
      this.logger.error("Failed to get RetroAchievements profile", { userId, error: errorInfo });
      return null;
    }
  }

  /**
   * Search for games on RetroAchievements.
   * Note: RetroAchievements API does not have a direct search endpoint.
   * This would require console-specific game list lookups.
   * @param _gameName - Game name to search (unused)
   * @param _consoleId - Optional console ID filter (unused)
   * @throws ValidationError - Game search is not supported for RetroAchievements API
   */
  async searchGames(_gameName: string, _consoleId?: number): Promise<RAGameInfo[]> {
    this.logger.warn("Game search attempted but not supported for RetroAchievements API");
    throw new ValidationError("Game search not supported for RetroAchievements API");
  }

  /**
   * Get achievements for a game with user unlock status.
   * @param retroGameId - RetroAchievements game ID
   * @param userId - User ID for unlock status lookup
   * @returns Normalized achievements with unlock status
   */
  async getAchievements(retroGameId: number, userId: string): Promise<NormalizedAchievement[]> {
    const { authorization, credentials } = await this.getAuthAndCredentials(userId);

    try {
      const gameProgress = await getGameInfoAndUserProgress(authorization, {
        username: credentials.username,
        gameId: retroGameId,
      });

      if (!gameProgress || !gameProgress.achievements) {
        return [];
      }

      const achievements = Object.values(gameProgress.achievements);
      const totalPlayers = gameProgress.numDistinctPlayersCasual;

      return achievements.map((ach) => {
        const earnedDate = ach.dateEarned || ach.dateEarnedHardcore;
        return {
          achievement_id: String(ach.id),
          name: ach.title,
          description: ach.description ?? "",
          icon_url: `https://media.retroachievements.org/Badge/${ach.badgeName}.png`,
          rarity_percentage: totalPlayers ? (ach.numAwarded / totalPlayers) * 100 : null,
          points: ach.points ?? null,
          unlocked: ach.dateEarned !== null || ach.dateEarnedHardcore !== null,
          unlock_time: earnedDate ? new Date(earnedDate) : null,
        };
      });
    } catch (error) {
      const errorInfo = error instanceof Error ? error.message : "unknown error";
      this.logger.error("Failed to get RetroAchievements achievements", {
        retroGameId,
        error: errorInfo,
      });
      return [];
    }
  }

  /**
   * Sync achievements for a game in user's library.
   * Fetches achievements from RetroAchievements and stores them in the database.
   * @param userId - User ID
   * @param gameId - Game ID in our system (must have retro_game_id)
   * @returns Sync result with counts
   * @throws NotFoundError if game not found or user doesn't own it
   * @throws ValidationError if game lacks RetroAchievements ID
   */
  async syncAchievements(userId: string, gameId: string): Promise<RASyncResult> {
    // Verify user owns the game before syncing achievements
    const userGames = await this.userGameRepository.getByGameForUser(userId, gameId);
    if (userGames.length === 0) {
      throw new NotFoundError("Game", gameId);
    }

    const game = await this.gameRepository.findById(gameId);
    if (!game) {
      throw new NotFoundError("Game", gameId);
    }

    if (!game.retro_game_id) {
      throw new ValidationError("Game does not have a RetroAchievements ID");
    }

    const achievements = await this.getAchievements(game.retro_game_id, userId);

    // Store achievements in database if there are any
    if (achievements.length > 0) {
      // Find or select a platform for these achievements
      // Try to find existing achievements for this game first, otherwise use a retro family platform
      let platformId: string;
      const existingAchievements = await this.achievementRepository.findByGameAndSource(
        gameId,
        "retroachievements"
      );

      if (existingAchievements.length > 0) {
        platformId = existingAchievements[0].platformId;
      } else {
        // For new RetroAchievements, try to find a retro family platform
        const retroPlatforms = await this.platformRepository.findByFamily("retro");
        const retroPlatform = retroPlatforms[0];
        platformId = retroPlatform?.id ?? (await this.platformRepository.list())[0]?.id;
        if (!platformId) {
          throw new ValidationError("No platform available for RetroAchievements");
        }
      }

      // Prepare achievement records
      const achievementRecords: NewAchievement[] = achievements.map((ach) => ({
        gameId,
        platformId,
        achievementId: ach.achievement_id,
        name: ach.name,
        description: ach.description,
        iconUrl: ach.icon_url || null,
        rarityPercentage: ach.rarity_percentage ?? null,
        points: ach.points ?? null,
        sourceApi: "retroachievements" as const,
        externalId: ach.achievement_id,
      }));

      // Build status map for user achievements
      const achievementStatus = new Map(
        achievements.map((ach) => [
          ach.achievement_id,
          { unlocked: ach.unlocked, unlockDate: ach.unlock_time ?? null },
        ])
      );

      // Upsert achievements and user achievements in a single transaction
      await this.achievementRepository.upsertAchievementsWithProgress(
        achievementRecords,
        userId,
        achievementStatus
      );

      this.logger.info("RetroAchievements synced and stored", {
        gameId,
        stored: achievements.length,
        unlocked: achievements.filter((a) => a.unlocked).length,
      });
    }

    return {
      synced: achievements.length,
      unlocked: achievements.filter((a) => a.unlocked).length,
      total: achievements.length,
    };
  }

  /**
   * Delete RetroAchievements credentials for a user.
   * @param userId - User ID
   */
  async deleteCredentials(userId: string): Promise<void> {
    await this.credentialRepository.delete(userId, "retroachievements");
    this.logger.info("RetroAchievements credentials deleted", { userId });
  }

  /**
   * Get authorization object and credentials for a user.
   * @param userId - User ID
   * @returns Authorization object and decrypted credentials
   * @throws NotFoundError if credentials not found
   */
  private async getAuthAndCredentials(userId: string): Promise<{
    authorization: ReturnType<typeof buildAuthorization>;
    credentials: RACredentials;
  }> {
    const credential = await this.credentialRepository.findByUserAndService(
      userId,
      "retroachievements"
    );
    if (!credential) {
      throw new NotFoundError("Credential", "retroachievements");
    }

    let credentials: RACredentials;
    try {
      credentials = this.encryptionService.decrypt<RACredentials>(credential.encryptedCredentials);
    } catch {
      throw new ValidationError("Unable to decrypt RetroAchievements credentials");
    }

    const authorization = buildAuthorization({
      username: credentials.username,
      webApiKey: credentials.api_key,
    });

    return { authorization, credentials };
  }
}
