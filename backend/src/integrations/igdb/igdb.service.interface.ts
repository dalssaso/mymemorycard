import type { GameDetails, GameSearchResult, PlatformFromIgdb } from "./igdb.mapper"
import type { IgdbFranchise } from "./igdb.types"

/**
 * IGDB credentials for authentication.
 */
export interface IgdbCredentials {
  client_id: string
  client_secret: string
}

/**
 * IGDB access token with expiry.
 */
export interface IgdbToken {
  access_token: string
  expires_in: number
}

/**
 * Service interface for IGDB API integration.
 */
export interface IIgdbService {
  /**
   * Authenticate with IGDB using Twitch OAuth credentials.
   * Obtains an access token for API calls.
   *
   * @param credentials - Twitch client ID and secret
   * @returns Access token and expiry
   * @throws ValidationError if authentication fails
   */
  authenticate(credentials: IgdbCredentials): Promise<IgdbToken>

  /**
   * Search for games by name.
   *
   * @param query - Search query string
   * @param userId - User ID for credential lookup
   * @param limit - Maximum results (default 10)
   * @returns Array of matching games
   * @throws NotFoundError if user credentials not found
   * @throws ValidationError if credentials invalid
   */
  searchGames(query: string, userId: string, limit?: number): Promise<GameSearchResult[]>

  /**
   * Get detailed information about a specific game.
   *
   * @param igdbId - IGDB game ID
   * @param userId - User ID for credential lookup
   * @returns Game details or null if not found
   * @throws NotFoundError if user credentials not found
   * @throws ValidationError if credentials invalid
   */
  getGameDetails(igdbId: number, userId: string): Promise<GameDetails | null>

  /**
   * Get platform information by IGDB ID.
   *
   * @param igdbId - IGDB platform ID
   * @param userId - User ID for credential lookup
   * @returns Platform details or null if not found
   * @throws NotFoundError if user credentials not found
   */
  getPlatform(igdbId: number, userId: string): Promise<PlatformFromIgdb | null>

  /**
   * Get multiple platforms by IGDB IDs.
   *
   * @param igdbIds - Array of IGDB platform IDs
   * @param userId - User ID for credential lookup
   * @returns Array of platform details
   */
  getPlatforms(igdbIds: number[], userId: string): Promise<PlatformFromIgdb[]>

  /**
   * Get franchise information by IGDB ID.
   *
   * @param igdbId - IGDB franchise ID
   * @param userId - User ID for credential lookup
   * @returns Franchise details or null if not found
   */
  getFranchise(igdbId: number, userId: string): Promise<IgdbFranchise | null>
}
