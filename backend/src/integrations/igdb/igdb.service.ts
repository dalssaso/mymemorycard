import { inject, injectable } from "tsyringe";

import {
  ENCRYPTION_SERVICE_TOKEN,
  IGDB_CACHE_TOKEN,
  USER_CREDENTIAL_REPOSITORY_TOKEN,
} from "@/container/tokens";
import type { IUserCredentialRepository } from "@/features/credentials/repositories/user-credential.repository.interface";
import type { IEncryptionService } from "@/features/credentials/services/encryption.service.interface";
import { Logger } from "@/infrastructure/logging/logger";
import { NotFoundError, ValidationError } from "@/shared/errors/base";

import { IgdbCache } from "./igdb.cache";
import {
  mapIgdbGameToGameDetails,
  mapIgdbGameToSearchResult,
  mapIgdbPlatformToPlatform,
  type GameDetails,
  type GameSearchResult,
  type PlatformFromIgdb,
} from "./igdb.mapper";
import { IgdbRateLimiter } from "./igdb.rate-limiter";
import type { IgdbFranchise, IgdbGame, IgdbPlatform, IgdbTokenResponse } from "./igdb.types";
import type { IgdbCredentials, IgdbToken, IIgdbService } from "./igdb.service.interface";

const IGDB_API_BASE = "https://api.igdb.com/v4";
const TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2/token";

/**
 * IGDB API service with rate limiting and caching.
 */
@injectable()
export class IgdbService implements IIgdbService {
  private logger: Logger;
  private rateLimiter: IgdbRateLimiter;

  constructor(
    @inject(USER_CREDENTIAL_REPOSITORY_TOKEN)
    private credentialRepository: IUserCredentialRepository,
    @inject(ENCRYPTION_SERVICE_TOKEN)
    private encryption: IEncryptionService,
    @inject(Logger) parentLogger: Logger,
    @inject(IGDB_CACHE_TOKEN) private cache: IgdbCache
  ) {
    this.logger = parentLogger.child("IgdbService");
    this.rateLimiter = new IgdbRateLimiter();
  }

  /**
   * Authenticate with IGDB using Twitch OAuth.
   *
   * @param credentials - Twitch client ID and secret
   * @returns Access token and expiry
   * @throws ValidationError if authentication fails
   */
  async authenticate(credentials: IgdbCredentials): Promise<IgdbToken> {
    this.logger.debug("Authenticating with Twitch OAuth");

    const url = new URL(TWITCH_AUTH_URL);
    url.searchParams.set("client_id", credentials.client_id);
    url.searchParams.set("client_secret", credentials.client_secret);
    url.searchParams.set("grant_type", "client_credentials");

    const response = await fetch(url.toString(), { method: "POST" });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Twitch auth failed: ${response.status} - ${error}`);
      throw new ValidationError("Failed to authenticate with IGDB. Check your credentials.");
    }

    const data = (await response.json()) as IgdbTokenResponse;

    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
    };
  }

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
  async searchGames(query: string, userId: string, limit = 10): Promise<GameSearchResult[]> {
    this.logger.debug(`Searching games: "${query}" for user ${userId}`);

    // Check cache first
    const cached = await this.cache.getCachedSearch(query);
    if (cached) {
      this.logger.debug(`Cache hit for search: ${query}`);
      return cached.map(mapIgdbGameToSearchResult);
    }

    const { clientId, token } = await this.getCredentialsAndToken(userId);

    const body = `
      search "${query}";
      fields name, slug, cover.image_id, platforms.id, platforms.name, platforms.abbreviation,
             franchises.id, franchises.name, websites.category, websites.url;
      where category = 0;
      limit ${limit};
    `;

    const games = await this.rateLimiter.schedule(async () => {
      return this.makeRequest<IgdbGame[]>("/games", clientId, token, body);
    });

    // Cache results
    if (games.length > 0) {
      await this.cache.cacheSearch(query, games);
    }

    return games.map(mapIgdbGameToSearchResult);
  }

  /**
   * Get detailed information about a specific game.
   *
   * @param igdbId - IGDB game ID
   * @param userId - User ID for credential lookup
   * @returns Game details or null if not found
   * @throws NotFoundError if user credentials not found
   * @throws ValidationError if credentials invalid
   */
  async getGameDetails(igdbId: number, userId: string): Promise<GameDetails | null> {
    this.logger.debug(`Getting game details: ${igdbId}`);

    // Check cache first
    const cached = await this.cache.getCachedGameDetails(igdbId);
    if (cached) {
      this.logger.debug(`Cache hit for game: ${igdbId}`);
      return mapIgdbGameToGameDetails(cached);
    }

    const { clientId, token } = await this.getCredentialsAndToken(userId);

    const body = `
      fields name, slug, summary, storyline, first_release_date, aggregated_rating, total_rating,
             cover.image_id, platforms.id, platforms.name, platforms.abbreviation,
             genres.id, genres.name, themes.id, themes.name, game_modes.id, game_modes.name,
             franchises.id, franchises.name, websites.category, websites.url;
      where id = ${igdbId};
    `;

    const games = await this.rateLimiter.schedule(async () => {
      return this.makeRequest<IgdbGame[]>("/games", clientId, token, body);
    });

    if (games.length === 0) {
      return null;
    }

    const game = games[0];

    // Cache result
    await this.cache.cacheGameDetails(igdbId, game);

    return mapIgdbGameToGameDetails(game);
  }

  /**
   * Get platform information by IGDB ID.
   *
   * @param igdbId - IGDB platform ID
   * @param userId - User ID for credential lookup
   * @returns Platform details or null if not found
   * @throws NotFoundError if user credentials not found
   */
  async getPlatform(igdbId: number, userId: string): Promise<PlatformFromIgdb | null> {
    this.logger.debug(`Getting platform: ${igdbId}`);

    // Check cache first
    const cached = await this.cache.getCachedPlatform(igdbId);
    if (cached) {
      this.logger.debug(`Cache hit for platform: ${igdbId}`);
      return mapIgdbPlatformToPlatform(cached);
    }

    const { clientId, token } = await this.getCredentialsAndToken(userId);

    const body = `
      fields name, abbreviation, slug, platform_family.id, platform_family.name;
      where id = ${igdbId};
    `;

    const platforms = await this.rateLimiter.schedule(async () => {
      return this.makeRequest<IgdbPlatform[]>("/platforms", clientId, token, body);
    });

    if (platforms.length === 0) {
      return null;
    }

    const platform = platforms[0];

    // Cache result
    await this.cache.cachePlatform(igdbId, platform);

    return mapIgdbPlatformToPlatform(platform);
  }

  /**
   * Get multiple platforms by IGDB IDs.
   *
   * @param igdbIds - Array of IGDB platform IDs
   * @param userId - User ID for credential lookup
   * @returns Array of platform details
   */
  async getPlatforms(igdbIds: number[], userId: string): Promise<PlatformFromIgdb[]> {
    if (igdbIds.length === 0) {
      return [];
    }

    this.logger.debug(`Getting platforms: ${igdbIds.join(", ")}`);

    const { clientId, token } = await this.getCredentialsAndToken(userId);

    const body = `
      fields name, abbreviation, slug, platform_family.id, platform_family.name;
      where id = (${igdbIds.join(",")});
    `;

    const platforms = await this.rateLimiter.schedule(async () => {
      return this.makeRequest<IgdbPlatform[]>("/platforms", clientId, token, body);
    });

    return platforms.map(mapIgdbPlatformToPlatform);
  }

  /**
   * Get franchise information by IGDB ID.
   *
   * @param igdbId - IGDB franchise ID
   * @param userId - User ID for credential lookup
   * @returns Franchise details or null if not found
   */
  async getFranchise(igdbId: number, userId: string): Promise<IgdbFranchise | null> {
    this.logger.debug(`Getting franchise: ${igdbId}`);

    const { clientId, token } = await this.getCredentialsAndToken(userId);

    const body = `
      fields name, slug, games;
      where id = ${igdbId};
    `;

    const franchises = await this.rateLimiter.schedule(async () => {
      return this.makeRequest<IgdbFranchise[]>("/franchises", clientId, token, body);
    });

    return franchises.length > 0 ? franchises[0] : null;
  }

  /**
   * Get user's IGDB credentials and obtain/refresh access token.
   */
  private async getCredentialsAndToken(
    userId: string
  ): Promise<{ clientId: string; token: string }> {
    const credential = await this.credentialRepository.findByUserAndService(userId, "igdb");

    if (!credential) {
      throw new NotFoundError("Credential", "igdb");
    }

    let decrypted: IgdbCredentials;
    try {
      decrypted = this.encryption.decrypt(credential.encryptedCredentials) as IgdbCredentials;
    } catch {
      throw new ValidationError("Failed to decrypt IGDB credentials");
    }

    if (!decrypted.client_id || !decrypted.client_secret) {
      throw new ValidationError("Invalid IGDB credentials format");
    }

    // Check for cached token
    const cachedToken = await this.cache.getCachedToken(userId);
    if (cachedToken) {
      return { clientId: decrypted.client_id, token: cachedToken };
    }

    // Obtain new token
    const tokenResult = await this.authenticate(decrypted);

    // Cache the token
    await this.cache.cacheToken(userId, tokenResult.access_token, tokenResult.expires_in);

    return { clientId: decrypted.client_id, token: tokenResult.access_token };
  }

  /**
   * Make authenticated request to IGDB API.
   */
  private async makeRequest<T>(
    endpoint: string,
    clientId: string,
    token: string,
    body: string
  ): Promise<T> {
    const url = `${IGDB_API_BASE}${endpoint}`;

    this.logger.debug(`IGDB API request: ${endpoint}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`IGDB API error: ${response.status} - ${error}`);

      if (response.status === 401) {
        throw new ValidationError("IGDB authentication expired. Please re-validate credentials.");
      }

      throw new Error(`IGDB API error: ${response.status}`);
    }

    return (await response.json()) as T;
  }
}
