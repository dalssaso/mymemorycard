import SteamAPI from "steamapi";
import type UserSummary from "steamapi/dist/src/structures/UserSummary.js";
import { inject, injectable } from "tsyringe";

import {
  ENCRYPTION_SERVICE_TOKEN,
  GAME_REPOSITORY_TOKEN,
  PLATFORM_REPOSITORY_TOKEN,
  STORE_REPOSITORY_TOKEN,
  USER_CREDENTIAL_REPOSITORY_TOKEN,
  USER_GAME_REPOSITORY_TOKEN,
} from "@/container/tokens";
import type { IUserCredentialRepository } from "@/features/credentials/repositories/user-credential.repository.interface";
import type { IEncryptionService } from "@/features/credentials/services/encryption.service.interface";
import type { IGameRepository } from "@/features/games/repositories/game.repository.interface";
import type { IStoreRepository } from "@/features/games/repositories/store.repository.interface";
import type { IUserGameRepository } from "@/features/games/repositories/user-game.repository.interface";
import type { IPlatformRepository } from "@/features/platforms/repositories/platform.repository.interface";
import { Logger } from "@/infrastructure/logging/logger";
import { NotFoundError, ValidationError } from "@/shared/errors/base";

import type { NormalizedAchievement } from "@/features/achievements/types";

import type { ISteamService } from "./steam.service.interface";
import type {
  SteamAchievementSyncResult,
  SteamCredentials,
  SteamLibraryImportResult,
  SteamOwnedGame,
  SteamPlayerSummary,
} from "./steam.types";

/**
 * Steam OpenID 2.0 endpoint for authentication
 */
const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";

/**
 * IGDB platform ID for PC (Windows)
 */
const PC_PLATFORM_IGDB_ID = 6;

/**
 * Build OpenID parameters for Steam authentication.
 * Using URLSearchParams.set() to avoid ESLint naming convention errors with dot-notation keys.
 */
function buildOpenIdParams(returnUrl: string): URLSearchParams {
  const params = new URLSearchParams();
  params.set("openid.ns", "http://specs.openid.net/auth/2.0");
  params.set("openid.mode", "checkid_setup");
  params.set("openid.return_to", returnUrl);
  params.set("openid.realm", new URL(returnUrl).origin);
  params.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
  params.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");
  return params;
}

/**
 * Steam service for library and achievement operations.
 * Uses Steam Web API via steamapi package and OpenID 2.0 for authentication.
 */
@injectable()
export class SteamService implements ISteamService {
  private logger: Logger;
  private steamApi: SteamAPI | null = null;

  constructor(
    @inject(USER_CREDENTIAL_REPOSITORY_TOKEN)
    private credentialRepository: IUserCredentialRepository,
    @inject(ENCRYPTION_SERVICE_TOKEN)
    private encryption: IEncryptionService,
    @inject(GAME_REPOSITORY_TOKEN)
    private gameRepository: IGameRepository,
    @inject(USER_GAME_REPOSITORY_TOKEN)
    private userGameRepository: IUserGameRepository,
    @inject(PLATFORM_REPOSITORY_TOKEN)
    private platformRepository: IPlatformRepository,
    @inject(STORE_REPOSITORY_TOKEN)
    private storeRepository: IStoreRepository,
    @inject(Logger) parentLogger: Logger
  ) {
    this.logger = parentLogger.child("SteamService");
    this.initializeSteamApi();
  }

  /**
   * Generate Steam OpenID login URL.
   * @param returnUrl - URL to redirect after Steam login
   * @returns Steam OpenID login URL
   */
  getLoginUrl(returnUrl: string): string {
    this.logger.debug("Generating Steam OpenID login URL", { returnUrl });
    const params = buildOpenIdParams(returnUrl);
    return `${STEAM_OPENID_URL}?${params.toString()}`;
  }

  /**
   * Validate Steam OpenID callback and extract Steam ID.
   * @param params - OpenID callback parameters
   * @returns Steam ID if valid, null otherwise
   */
  async validateCallback(params: Record<string, string>): Promise<string | null> {
    this.logger.debug("Validating Steam OpenID callback");

    // Verify required OpenID parameters
    const openIdMode = params["openid.mode"];
    if (openIdMode !== "id_res") {
      this.logger.warn("Invalid OpenID mode", { mode: openIdMode });
      return null;
    }

    // Build verification request
    const verifyParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      verifyParams.append(key, value);
    }
    verifyParams.set("openid.mode", "check_authentication");

    // Create AbortController with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(STEAM_OPENID_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: verifyParams.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        this.logger.warn("Steam OpenID request failed", {
          status: response.status,
          statusText: response.statusText,
        });
        return null;
      }

      const text = await response.text();

      if (!text.includes("is_valid:true")) {
        this.logger.warn("Steam OpenID validation failed");
        return null;
      }

      // Extract Steam ID from claimed_id
      // Format: https://steamcommunity.com/openid/id/76561198012345678
      const claimedId = params["openid.claimed_id"];
      const match = claimedId?.match(/\/id\/(\d+)$/);

      if (!match) {
        this.logger.warn("Could not extract Steam ID from claimed_id", { claimedId });
        return null;
      }

      const steamId = match[1];
      this.logger.info("Steam OpenID validation successful", { steamId });
      return steamId;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        this.logger.warn("Steam OpenID validation timed out");
        return null;
      }
      this.logger.error("Steam OpenID validation error", error);
      return null;
    }
  }

  /**
   * Get player summary from Steam API.
   * @param steamId - Steam 64-bit ID
   * @returns Player summary or null if not found
   */
  async getPlayerSummary(steamId: string): Promise<SteamPlayerSummary | null> {
    this.logger.debug("Getting player summary", { steamId });

    try {
      const api = this.getSteamApi();
      const summary = (await api.getUserSummary(steamId)) as UserSummary;

      return {
        steamid: summary.steamID,
        personaname: summary.nickname,
        profileurl: summary.url,
        avatar: summary.avatar.small,
        avatarmedium: summary.avatar.medium,
        avatarfull: summary.avatar.large,
        personastate: summary.personaState,
        communityvisibilitystate: summary.visible ? 3 : 1,
        profilestate: 1,
        lastlogoff: summary.lastLogOffTimestamp,
        realname: summary.realName,
        primaryclanid: summary.primaryGroupID,
        timecreated: summary.createdTimestamp,
        gameid: summary.gameID?.toString(),
        gameextrainfo: summary.gameName,
        loccountrycode: summary.countryCode,
        locstatecode: summary.stateCode,
        loccityid: summary.cityID ? parseInt(summary.cityID, 10) : undefined,
      };
    } catch (error) {
      this.logger.error("Failed to get player summary", error);
      return null;
    }
  }

  /**
   * Get user's owned games from Steam API.
   * @param steamId - Steam 64-bit ID
   * @returns List of owned games
   */
  async getOwnedGames(steamId: string): Promise<SteamOwnedGame[]> {
    this.logger.debug("Getting owned games", { steamId });

    try {
      const api = this.getSteamApi();
      const games = await api.getUserOwnedGames(steamId, {
        includeAppInfo: true,
        includeFreeGames: true,
        includeExtendedAppInfo: true,
      });

      return games.map((playtime) => ({
        appid: playtime.game.id,
        name: "name" in playtime.game ? (playtime.game.name as string) : `App ${playtime.game.id}`,
        playtime_forever: playtime.minutes,
        playtime_windows_forever: playtime.windowsMinutes,
        playtime_mac_forever: playtime.macMinutes,
        playtime_linux_forever: playtime.linuxMinutes,
        playtime_2weeks: playtime.recentMinutes,
        img_icon_url: "icon" in playtime.game ? (playtime.game.icon as string) : "",
        has_community_visible_stats:
          "hasCommunityVisibleStats" in playtime.game
            ? (playtime.game.hasCommunityVisibleStats as boolean)
            : undefined,
        playtime_disconnected: playtime.disconnectedMinutes,
      }));
    } catch (error) {
      this.logger.error("Failed to get owned games", error);
      return [];
    }
  }

  /**
   * Import Steam library for a user.
   * @param userId - User ID in our system
   * @returns Import result with counts
   */
  async importLibrary(userId: string): Promise<SteamLibraryImportResult> {
    this.logger.info("Importing Steam library", { userId });

    const result: SteamLibraryImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
    };

    // Get user's Steam credentials
    const credentials = await this.getCredentials(userId);

    // Get Steam library
    const games = await this.getOwnedGames(credentials.steam_id);
    this.logger.info("Found Steam games", { count: games.length });

    // Get PC platform and Steam store
    const pcPlatform = await this.platformRepository.getByIgdbId(PC_PLATFORM_IGDB_ID);
    if (!pcPlatform) {
      throw new ValidationError("PC platform not found in database");
    }

    const steamStore = await this.storeRepository.findBySlug("steam");
    if (!steamStore) {
      throw new ValidationError("Steam store not found in database");
    }

    for (const steamGame of games) {
      try {
        // Check if game exists in our database by Steam App ID
        let game = await this.gameRepository.findBySteamAppId(steamGame.appid);

        if (!game) {
          // Create a basic game entry with Steam App ID
          game = await this.gameRepository.create({
            name: steamGame.name,
            steam_app_id: steamGame.appid,
            metadata_source: "manual",
          });
        }

        // Check if user already has this game
        const existingUserGame = await this.userGameRepository.findByUserGamePlatform(
          userId,
          game.id,
          pcPlatform.id
        );

        if (existingUserGame) {
          result.skipped++;
          continue;
        }

        // Add to user's library
        await this.userGameRepository.create({
          user_id: userId,
          game_id: game.id,
          platform_id: pcPlatform.id,
          store_id: steamStore.id,
          platform_game_id: steamGame.appid.toString(),
          owned: true,
          import_source: "steam",
        });

        result.imported++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        this.logger.warn("Failed to import game", {
          appid: steamGame.appid,
          name: steamGame.name,
          error: errorMessage,
        });
        result.errors.push({
          appid: steamGame.appid,
          name: steamGame.name,
          error: errorMessage,
        });
      }
    }

    this.logger.info("Steam library import complete", result);
    return result;
  }

  /**
   * Sync achievements for a specific game.
   * @param userId - User ID in our system
   * @param gameId - Game ID in our system (must have steam_app_id)
   * @returns Sync result
   */
  async syncAchievements(userId: string, gameId: string): Promise<SteamAchievementSyncResult> {
    this.logger.debug("Syncing achievements", { userId, gameId });

    // Get game and verify it has a Steam App ID
    const game = await this.gameRepository.findById(gameId);
    if (!game) {
      throw new NotFoundError("Game", gameId);
    }

    if (!game.steam_app_id) {
      throw new ValidationError("Game does not have a Steam App ID");
    }

    // Get user's Steam credentials
    const credentials = await this.getCredentials(userId);

    // Get achievements
    const achievements = await this.getAchievements(game.steam_app_id, credentials.steam_id);

    const result: SteamAchievementSyncResult = {
      synced: achievements.length,
      unlocked: achievements.filter((a) => a.unlocked).length,
      total: achievements.length,
    };

    this.logger.info("Achievement sync complete", { gameId, ...result });
    return result;
  }

  /**
   * Get achievements for a game from Steam.
   * @param steamAppId - Steam App ID
   * @param steamId - Steam 64-bit ID (for user's unlock status)
   * @returns Normalized achievements with unlock status
   */
  async getAchievements(steamAppId: number, steamId: string): Promise<NormalizedAchievement[]> {
    this.logger.debug("Getting achievements", { steamAppId, steamId });

    const api = this.getSteamApi();

    try {
      // Get game schema for achievement details
      const schema = await api.getGameSchema(steamAppId);
      const schemaAchievements = schema.availableGameStats?.achievements || [];

      if (schemaAchievements.length === 0) {
        return [];
      }

      // Get global achievement percentages
      let percentages: Map<string, number> = new Map();
      try {
        const globalPercentages = await api.getGameAchievementPercentages(steamAppId);
        percentages = new Map(globalPercentages.map((p) => [p.name, p.percent]));
      } catch {
        this.logger.debug("Could not fetch global achievement percentages", { steamAppId });
      }

      // Get user's achievements
      let userAchievements: Map<string, { unlocked: boolean; unlockTime: Date | undefined }> =
        new Map();
      try {
        const userAchData = await api.getUserAchievements(steamId, steamAppId);
        userAchievements = new Map(
          userAchData.achievements.map((a) => [
            a.name,
            { unlocked: a.unlocked, unlockTime: a.unlockedAt },
          ])
        );
      } catch {
        this.logger.debug("Could not fetch user achievements (may be private)", {
          steamAppId,
          steamId,
        });
      }

      // Normalize achievements
      return schemaAchievements.map((ach) => {
        const userAch = userAchievements.get(ach.name);
        return {
          achievement_id: ach.name,
          name: ach.displayName || ach.name,
          description: ach.description || "",
          icon_url: ach.icon || "",
          rarity_percentage: percentages.get(ach.name) ?? null,
          unlocked: userAch?.unlocked ?? false,
          unlock_time: userAch?.unlockTime ?? null,
        };
      });
    } catch (error) {
      this.logger.error("Failed to get achievements", { steamAppId, error });
      return [];
    }
  }

  /**
   * Get achievements for a user (resolves credentials internally).
   * @param userId - User ID in our system
   * @param steamAppId - Steam App ID
   * @returns Normalized achievements with unlock status
   */
  async getAchievementsForUser(
    userId: string,
    steamAppId: number
  ): Promise<NormalizedAchievement[]> {
    const credentials = await this.getCredentials(userId);
    return this.getAchievements(steamAppId, credentials.steam_id);
  }

  /**
   * Link Steam account to user (save credentials).
   * @param userId - User ID
   * @param steamId - Steam 64-bit ID
   * @returns Saved credentials info
   */
  async linkAccount(userId: string, steamId: string): Promise<SteamCredentials> {
    this.logger.info("Linking Steam account", { userId, steamId });

    // Get player summary for display info
    const summary = await this.getPlayerSummary(steamId);
    if (!summary) {
      throw new ValidationError("Could not retrieve Steam profile information");
    }

    const credentials: SteamCredentials = {
      steam_id: steamId,
      display_name: summary.personaname,
      avatar_url: summary.avatarfull,
      profile_url: summary.profileurl,
      linked_at: new Date().toISOString(),
    };

    // Encrypt and store credentials
    const encryptedCredentials = this.encryption.encrypt(credentials);

    await this.credentialRepository.upsert(userId, {
      service: "steam",
      credentialType: "steam_openid",
      encryptedCredentials,
      isActive: true,
      hasValidToken: true,
    });

    this.logger.info("Steam account linked successfully", { userId, steamId });
    return credentials;
  }

  /**
   * Unlink Steam account from user.
   * @param userId - User ID
   */
  async unlinkAccount(userId: string): Promise<void> {
    this.logger.info("Unlinking Steam account", { userId });
    await this.credentialRepository.delete(userId, "steam");
    this.logger.info("Steam account unlinked successfully", { userId });
  }

  /**
   * Initialize Steam API client if API key is available.
   */
  private initializeSteamApi(): void {
    const apiKey = process.env.STEAM_API_KEY;
    if (apiKey) {
      this.steamApi = new SteamAPI(apiKey);
      this.logger.debug("Steam API client initialized");
    } else {
      this.logger.warn("STEAM_API_KEY not configured, Steam API calls will fail");
    }
  }

  /**
   * Get the Steam API client, throwing if not configured.
   */
  private getSteamApi(): SteamAPI {
    if (!this.steamApi) {
      throw new ValidationError("Steam API key not configured");
    }
    return this.steamApi;
  }

  /**
   * Get decrypted Steam credentials for a user.
   * @param userId - User ID
   * @returns Decrypted Steam credentials
   * @throws NotFoundError if credentials not found
   * @throws ValidationError if decryption fails
   */
  private async getCredentials(userId: string): Promise<SteamCredentials> {
    const credential = await this.credentialRepository.findByUserAndService(userId, "steam");

    if (!credential) {
      throw new NotFoundError("Steam credentials", userId);
    }

    try {
      const decrypted = this.encryption.decrypt<SteamCredentials>(credential.encryptedCredentials);

      if (!decrypted.steam_id) {
        throw new ValidationError("Invalid Steam credentials format");
      }

      return decrypted;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError("Failed to decrypt Steam credentials");
    }
  }
}
