import {
  buildAuthorization,
  getGameInfoAndUserProgress,
  getUserProfile as raGetUserProfile,
} from "@retroachievements/api";
import { inject, injectable } from "tsyringe";

import {
  ENCRYPTION_SERVICE_TOKEN,
  GAME_REPOSITORY_TOKEN,
  USER_CREDENTIAL_REPOSITORY_TOKEN,
} from "@/container/tokens";
import type { IUserCredentialRepository } from "@/features/credentials/repositories/user-credential.repository.interface";
import type { IEncryptionService } from "@/features/credentials/services/encryption.service.interface";
import type { IGameRepository } from "@/features/games/repositories/game.repository.interface";
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
      this.logger.warn("RetroAchievements credential validation failed", { error });
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
      this.logger.error("Failed to get RetroAchievements profile", { userId, error });
      return null;
    }
  }

  /**
   * Search for games on RetroAchievements.
   * Note: RetroAchievements API does not have a direct search endpoint.
   * This would require console-specific game list lookups.
   * @param _gameName - Game name to search (unused)
   * @param _consoleId - Optional console ID filter (unused)
   * @returns Empty array - search not fully implemented
   */
  async searchGames(_gameName: string, _consoleId?: number): Promise<RAGameInfo[]> {
    // Note: RetroAchievements API doesn't have a direct search endpoint
    // A full implementation would require getGameList with console filtering
    this.logger.warn("Game search not fully implemented - requires console-specific lookup");
    return [];
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
      this.logger.error("Failed to get RetroAchievements achievements", { retroGameId, error });
      return [];
    }
  }

  /**
   * Sync achievements for a game in user's library.
   * @param userId - User ID
   * @param gameId - Game ID in our system (must have retro_game_id)
   * @returns Sync result with counts
   * @throws NotFoundError if game not found
   * @throws ValidationError if game lacks RetroAchievements ID
   */
  async syncAchievements(userId: string, gameId: string): Promise<RASyncResult> {
    const game = await this.gameRepository.findById(gameId);
    if (!game) {
      throw new NotFoundError("Game", gameId);
    }

    if (!game.retro_game_id) {
      throw new ValidationError("Game does not have a RetroAchievements ID");
    }

    const achievements = await this.getAchievements(game.retro_game_id, userId);

    // TODO: Store achievements in database with source_api = 'retroachievements'
    // This will be implemented in a future task with unified achievement storage

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
