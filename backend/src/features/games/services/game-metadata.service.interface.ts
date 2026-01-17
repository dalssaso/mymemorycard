import type { GameSearchResult, GameDetails } from "@/integrations/igdb/igdb.mapper";
import type { Game, UserGame, Platform } from "../types";

/**
 * Service for orchestrating game metadata management across IGDB,
 * game imports, and user library operations.
 */
export interface IGameMetadataService {
  /**
   * Search games on IGDB.
   * @param query - Search query
   * @param userId - User ID (for credential lookup)
   * @param limit - Max results (default 10)
   * @returns Array of IGDB game search results
   * @throws {ValidationError} If user doesn't have IGDB credentials
   */
  searchGames(query: string, userId: string, limit?: number): Promise<GameSearchResult[]>;

  /**
   * Get game details from IGDB.
   * @param igdbId - IGDB game ID
   * @param userId - User ID (for credential lookup)
   * @returns Detailed game data from IGDB
   * @throws {ValidationError} If user doesn't have IGDB credentials
   */
  getGameDetails(igdbId: number, userId: string): Promise<GameDetails | null>;

  /**
   * Import a game into user library.
   * Creates game record, downloads cover art, creates user_game entry.
   * @param igdbId - IGDB game ID
   * @param userId - User ID
   * @param platformId - Platform ID (user owns game on this platform)
   * @param storeId - Store ID (optional, where user bought it)
   * @returns Created user game entry
   * @throws {NotFoundError} If platform/store not found
   * @throws {ValidationError} If user doesn't have IGDB credentials
   */
  importGame(
    igdbId: number,
    userId: string,
    platformId: string,
    storeId?: string
  ): Promise<UserGame>;

  /**
   * Update game metadata from IGDB.
   * @param gameId - Game ID (UUID)
   * @param userId - User ID (for ownership check)
   * @returns Updated game
   * @throws {NotFoundError} If game not found
   * @throws {ValidationError} If user doesn't have IGDB credentials
   */
  updateGameMetadata(gameId: string, userId: string): Promise<Game>;

  /**
   * Get or create platform from IGDB data.
   * @param igdbPlatformId - IGDB platform ID
   * @param userId - User ID (for credential lookup)
   * @returns Platform (created or existing)
   * @throws {ValidationError} If user doesn't have IGDB credentials
   */
  getOrCreatePlatform(igdbPlatformId: number, userId: string): Promise<Platform>;
}
