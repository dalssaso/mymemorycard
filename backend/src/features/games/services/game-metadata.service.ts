import { inject, injectable } from "tsyringe";

import {
  CREDENTIAL_SERVICE_TOKEN,
  GAME_REPOSITORY_TOKEN,
  GAMES_PLATFORM_REPOSITORY_TOKEN,
  IGDB_SERVICE_TOKEN,
  STORE_REPOSITORY_TOKEN,
  USER_GAME_REPOSITORY_TOKEN,
} from "@/container/tokens";
import { Logger } from "@/infrastructure/logging/logger";
import { NotFoundError, ValidationError } from "@/shared/errors/base";
import type { IIgdbService } from "@/integrations/igdb";
import type { ICredentialService } from "@/features/credentials/services/credential.service.interface";
import type { GameSearchResult, GameDetails } from "@/integrations/igdb/igdb.mapper";

import type { IGameRepository } from "../repositories/game.repository.interface";
import type { IUserGameRepository } from "../repositories/user-game.repository.interface";
import type { IPlatformRepository } from "../repositories/platform.repository.interface";
import type { IStoreRepository } from "../repositories/store.repository.interface";
import type { Game, UserGame, Platform } from "../types";
import type { IGameMetadataService } from "./game-metadata.service.interface";

/**
 * Service for orchestrating game metadata management across IGDB,
 * game imports, and user library operations.
 */
@injectable()
export class GameMetadataService implements IGameMetadataService {
  private logger: Logger;

  constructor(
    @inject(GAME_REPOSITORY_TOKEN)
    private gameRepository: IGameRepository,
    @inject(USER_GAME_REPOSITORY_TOKEN)
    private userGameRepository: IUserGameRepository,
    @inject(GAMES_PLATFORM_REPOSITORY_TOKEN)
    private platformRepository: IPlatformRepository,
    @inject(STORE_REPOSITORY_TOKEN)
    private storeRepository: IStoreRepository,
    @inject(IGDB_SERVICE_TOKEN)
    private igdbService: IIgdbService,
    @inject(CREDENTIAL_SERVICE_TOKEN)
    private credentialService: ICredentialService,
    @inject(Logger) parentLogger: Logger
  ) {
    this.logger = parentLogger.child("GameMetadataService");
  }

  /**
   * Search games on IGDB.
   * @param query - Search query
   * @param userId - User ID (for credential lookup)
   * @param limit - Max results (default 10)
   * @returns Array of IGDB game search results
   * @throws {ValidationError} If user doesn't have IGDB credentials
   */
  async searchGames(query: string, userId: string, limit = 10): Promise<GameSearchResult[]> {
    this.logger.debug(`Searching games: "${query}" for user ${userId}`);

    // Verify user has valid IGDB credentials
    await this.validateCredentials(userId);

    return this.igdbService.searchGames(query, userId, limit);
  }

  /**
   * Get game details from IGDB.
   * @param igdbId - IGDB game ID
   * @param userId - User ID (for credential lookup)
   * @returns Detailed game data from IGDB
   * @throws {ValidationError} If user doesn't have IGDB credentials
   */
  async getGameDetails(igdbId: number, userId: string): Promise<GameDetails | null> {
    this.logger.debug(`Getting game details: ${igdbId} for user ${userId}`);

    // Verify user has valid IGDB credentials
    await this.validateCredentials(userId);

    return this.igdbService.getGameDetails(igdbId, userId);
  }

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
  async importGame(
    igdbId: number,
    userId: string,
    platformId: string,
    storeId?: string
  ): Promise<UserGame> {
    this.logger.debug(
      `Importing game: igdbId=${igdbId}, userId=${userId}, platformId=${platformId}`
    );

    // Check credential exists and is valid
    await this.validateCredentials(userId);

    // Fetch game details from IGDB
    const gameDetails = await this.igdbService.getGameDetails(igdbId, userId);
    if (!gameDetails) {
      throw new NotFoundError("Game", `igdbId=${igdbId}`);
    }

    // Check platform exists
    const platform = await this.platformRepository.findById(platformId);
    if (!platform) {
      throw new NotFoundError("Platform", platformId);
    }

    // Check store exists if provided
    if (storeId) {
      const store = await this.storeRepository.findById(storeId);
      if (!store) {
        throw new NotFoundError("Store", storeId);
      }
    }

    // Create game record (or get existing by igdbId)
    let game = await this.gameRepository.findByIgdbId(igdbId);
    if (!game) {
      game = await this.gameRepository.create({
        igdb_id: igdbId,
        name: gameDetails.name,
        slug: gameDetails.slug,
        release_date: gameDetails.release_date ? new Date(gameDetails.release_date) : undefined,
        description: gameDetails.summary || gameDetails.storyline || undefined,
        cover_art_url: gameDetails.cover_url || undefined,
        metadata_source: "igdb",
      });
    }

    // Create user_game entry linking user to game on platform/store
    const userGame = await this.userGameRepository.create({
      user_id: userId,
      game_id: game.id,
      platform_id: platformId,
      store_id: storeId,
      owned: true,
      import_source: "igdb",
    });

    this.logger.info(`Game imported: ${game.id} for user ${userId}`);

    return userGame;
  }

  /**
   * Update game metadata from IGDB.
   * @param gameId - Game ID (UUID)
   * @param userId - User ID (for ownership check)
   * @returns Updated game
   * @throws {NotFoundError} If game not found
   * @throws {ValidationError} If user doesn't have IGDB credentials
   */
  async updateGameMetadata(gameId: string, userId: string): Promise<Game> {
    this.logger.debug(`Updating game metadata: gameId=${gameId}, userId=${userId}`);

    // Check credential exists and is valid
    await this.validateCredentials(userId);

    // Get the game
    const game = await this.gameRepository.findById(gameId);
    if (!game) {
      throw new NotFoundError("Game", gameId);
    }

    // Verify user owns at least one entry for this game
    const userGames = await this.userGameRepository.getByGameForUser(userId, gameId);
    if (userGames.length === 0) {
      throw new NotFoundError("Game", gameId);
    }

    // If game doesn't have IGDB ID, can't update
    if (!game.igdb_id) {
      throw new ValidationError("Cannot update game metadata: game not from IGDB");
    }

    // Fetch latest from IGDB
    const gameDetails = await this.igdbService.getGameDetails(game.igdb_id, userId);
    if (!gameDetails) {
      throw new NotFoundError("Game", `igdb_id=${game.igdb_id}`);
    }

    // Update game record
    const updatedGame = await this.gameRepository.update(gameId, {
      name: gameDetails.name,
      slug: gameDetails.slug,
      release_date: gameDetails.release_date ? new Date(gameDetails.release_date) : undefined,
      description: gameDetails.summary || gameDetails.storyline || undefined,
      cover_art_url: gameDetails.cover_url || undefined,
    });

    this.logger.info(`Game metadata updated: ${gameId}`);

    return updatedGame;
  }

  /**
   * Get or create platform from IGDB data.
   * @param igdbPlatformId - IGDB platform ID
   * @param userId - User ID (for credential lookup)
   * @returns Platform (created or existing)
   * @throws {ValidationError} If user doesn't have IGDB credentials
   */
  async getOrCreatePlatform(igdbPlatformId: number, userId: string): Promise<Platform> {
    this.logger.debug(
      `Getting or creating platform: igdbPlatformId=${igdbPlatformId}, userId=${userId}`
    );

    // Check credential exists and is valid
    await this.validateCredentials(userId);

    // Fetch platform data from IGDB
    const platformData = await this.igdbService.getPlatform(igdbPlatformId, userId);
    if (!platformData) {
      throw new NotFoundError("Platform", `igdbPlatformId=${igdbPlatformId}`);
    }

    // Use platform repository's getOrCreate() method
    const platform = await this.platformRepository.getOrCreate(igdbPlatformId, platformData.name, {
      abbreviation: platformData.abbreviation,
      slug: platformData.slug,
      platform_family: platformData.platform_family,
      color_primary: "#999999",
    });

    return platform;
  }

  /**
   * Validate that user has active IGDB credentials.
   * @param userId - User ID to validate credentials for
   * @throws {ValidationError} If credentials not found or invalid
   */
  private async validateCredentials(userId: string): Promise<void> {
    try {
      const credentials = await this.credentialService.listCredentials(userId);
      const igdbCred = credentials.services.find((c) => c.service === "igdb");

      if (!igdbCred || !igdbCred.is_active || !igdbCred.has_valid_token) {
        throw new ValidationError("User does not have valid IGDB credentials");
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.logger.error(`Credential validation error: ${error}`);
      throw new ValidationError("Failed to validate IGDB credentials");
    }
  }
}
