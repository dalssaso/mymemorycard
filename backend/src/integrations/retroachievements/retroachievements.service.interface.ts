import type {
  RAUserProfile,
  RAGameInfo,
  RACredentials,
  RASyncResult,
} from "./retroachievements.types";
import type { NormalizedAchievement } from "@/integrations/steam/steam.types";

/**
 * RetroAchievements service interface
 */
export interface IRetroAchievementsService {
  /**
   * Validate RetroAchievements credentials
   * @param credentials - Username and API key
   * @returns true if valid
   */
  validateCredentials(credentials: RACredentials): Promise<boolean>;

  /**
   * Save RetroAchievements credentials for a user
   * @param userId - User ID
   * @param credentials - Username and API key
   */
  saveCredentials(userId: string, credentials: RACredentials): Promise<void>;

  /**
   * Get user profile from RetroAchievements
   * @param userId - User ID in our system
   * @returns User profile or null
   */
  getUserProfile(userId: string): Promise<RAUserProfile | null>;

  /**
   * Search for a game on RetroAchievements
   * @param gameName - Game name to search
   * @param consoleId - Optional console ID filter
   * @returns List of matching games
   */
  searchGames(gameName: string, consoleId?: number): Promise<RAGameInfo[]>;

  /**
   * Get achievements for a game
   * @param retroGameId - RetroAchievements game ID
   * @param userId - User ID for unlock status
   * @returns Normalized achievements
   */
  getAchievements(retroGameId: number, userId: string): Promise<NormalizedAchievement[]>;

  /**
   * Sync achievements for a game
   * @param userId - User ID
   * @param gameId - Game ID in our system (must have retro_game_id)
   * @returns Sync result
   */
  syncAchievements(userId: string, gameId: string): Promise<RASyncResult>;

  /**
   * Delete RetroAchievements credentials
   * @param userId - User ID
   */
  deleteCredentials(userId: string): Promise<void>;
}
