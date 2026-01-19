import type { NormalizedAchievement } from "@/features/achievements/types";

import type {
  SteamPlayerSummary,
  SteamOwnedGame,
  SteamCredentials,
  SteamLibraryImportResult,
  SteamAchievementSyncResult,
} from "./steam.types";

/**
 * Steam service interface for library and achievement operations
 */
export interface ISteamService {
  /**
   * Generate Steam OpenID login URL
   * @param returnUrl - URL to redirect after Steam login
   * @returns Steam OpenID login URL
   */
  getLoginUrl(returnUrl: string): string;

  /**
   * Validate Steam OpenID callback and extract Steam ID
   * @param params - OpenID callback parameters
   * @returns Steam ID if valid, null otherwise
   */
  validateCallback(params: Record<string, string>): Promise<string | null>;

  /**
   * Get player summary from Steam API
   * @param steamId - Steam 64-bit ID
   * @returns Player summary or null if not found
   */
  getPlayerSummary(steamId: string): Promise<SteamPlayerSummary | null>;

  /**
   * Get user's owned games from Steam API
   * @param steamId - Steam 64-bit ID
   * @returns List of owned games
   */
  getOwnedGames(steamId: string): Promise<SteamOwnedGame[]>;

  /**
   * Import Steam library for a user
   * @param userId - User ID in our system
   * @returns Import result with counts
   */
  importLibrary(userId: string): Promise<SteamLibraryImportResult>;

  /**
   * Sync achievements for a specific game
   * @param userId - User ID in our system
   * @param gameId - Game ID in our system (must have steam_app_id)
   * @returns Sync result
   */
  syncAchievements(userId: string, gameId: string): Promise<SteamAchievementSyncResult>;

  /**
   * Get achievements for a game from Steam
   * @param steamAppId - Steam App ID
   * @param steamId - Steam 64-bit ID (for user's unlock status)
   * @returns Normalized achievements with unlock status
   */
  getAchievements(steamAppId: number, steamId: string): Promise<NormalizedAchievement[]>;

  /**
   * Get achievements for a user (resolves credentials internally)
   * @param userId - User ID in our system
   * @param steamAppId - Steam App ID
   * @returns Normalized achievements with unlock status
   */
  getAchievementsForUser(userId: string, steamAppId: number): Promise<NormalizedAchievement[]>;

  /**
   * Link Steam account to user (save credentials)
   * @param userId - User ID
   * @param steamId - Steam 64-bit ID
   * @returns Saved credentials info
   */
  linkAccount(userId: string, steamId: string): Promise<SteamCredentials>;

  /**
   * Unlink Steam account from user
   * @param userId - User ID
   */
  unlinkAccount(userId: string): Promise<void>;
}
