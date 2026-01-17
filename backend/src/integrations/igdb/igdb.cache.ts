import type { IgdbGame, IgdbPlatform } from "./igdb.types";

/**
 * TTL values for IGDB cache entries (in seconds).
 */
const CACHE_TTL = {
  search: 60 * 60 * 24 * 7, // 7 days for search results
  gameDetails: 60 * 60 * 24 * 30, // 30 days for game details
  platform: 60 * 60 * 24 * 30, // 30 days for platforms
  token: 60 * 60 * 24 * 7, // 7 days for auth tokens (refreshed before expiry)
} as const;

/**
 * Minimal Redis client interface for cache operations.
 */
interface RedisClient {
  get(key: string): Promise<string | null>;
  setEx(key: string, seconds: number, value: string): Promise<string>;
  del(key: string | string[]): Promise<number>;
}

/**
 * Redis cache utilities for IGDB API responses.
 */
export class IgdbCache {
  constructor(private redis: RedisClient) {}

  /**
   * Get cached search results.
   *
   * @param query - Search query string
   * @returns Cached games or null if miss
   */
  async getCachedSearch(query: string): Promise<IgdbGame[] | null> {
    try {
      const key = `igdb:search:${query}`;
      const cached = await this.redis.get(key);
      return cached ? (JSON.parse(cached) as IgdbGame[]) : null;
    } catch {
      return null;
    }
  }

  /**
   * Cache search results.
   *
   * @param query - Search query string
   * @param games - Games to cache
   */
  async cacheSearch(query: string, games: IgdbGame[]): Promise<void> {
    try {
      const key = `igdb:search:${query}`;
      await this.redis.setEx(key, CACHE_TTL.search, JSON.stringify(games));
    } catch {
      // Ignore cache errors - continue without caching
    }
  }

  /**
   * Get cached game details.
   *
   * @param igdbId - IGDB game ID
   * @returns Cached game or null if miss
   */
  async getCachedGameDetails(igdbId: number): Promise<IgdbGame | null> {
    try {
      const key = `igdb:game:${igdbId}`;
      const cached = await this.redis.get(key);
      return cached ? (JSON.parse(cached) as IgdbGame) : null;
    } catch {
      return null;
    }
  }

  /**
   * Cache game details.
   *
   * @param igdbId - IGDB game ID
   * @param game - Game to cache
   */
  async cacheGameDetails(igdbId: number, game: IgdbGame): Promise<void> {
    try {
      const key = `igdb:game:${igdbId}`;
      await this.redis.setEx(key, CACHE_TTL.gameDetails, JSON.stringify(game));
    } catch {
      // Ignore cache errors
    }
  }

  /**
   * Get cached platform details.
   *
   * @param igdbId - IGDB platform ID
   * @returns Cached platform or null if miss
   */
  async getCachedPlatform(igdbId: number): Promise<IgdbPlatform | null> {
    try {
      const key = `igdb:platform:${igdbId}`;
      const cached = await this.redis.get(key);
      return cached ? (JSON.parse(cached) as IgdbPlatform) : null;
    } catch {
      return null;
    }
  }

  /**
   * Cache platform details.
   *
   * @param igdbId - IGDB platform ID
   * @param platform - Platform to cache
   */
  async cachePlatform(igdbId: number, platform: IgdbPlatform): Promise<void> {
    try {
      const key = `igdb:platform:${igdbId}`;
      await this.redis.setEx(key, CACHE_TTL.platform, JSON.stringify(platform));
    } catch {
      // Ignore cache errors
    }
  }

  /**
   * Get cached access token.
   *
   * @param userId - User ID
   * @returns Cached token or null if miss
   */
  async getCachedToken(userId: string): Promise<string | null> {
    try {
      const key = `igdb:token:${userId}`;
      return await this.redis.get(key);
    } catch {
      return null;
    }
  }

  /**
   * Cache access token.
   *
   * @param userId - User ID
   * @param token - Access token
   * @param expiresIn - Token TTL in seconds
   */
  async cacheToken(userId: string, token: string, expiresIn: number): Promise<void> {
    try {
      const key = `igdb:token:${userId}`;
      // Cache for slightly less than expiry to ensure refresh
      const ttl = Math.min(expiresIn - 300, CACHE_TTL.token);
      await this.redis.setEx(key, ttl, token);
    } catch {
      // Ignore cache errors
    }
  }

  /**
   * Invalidate cached token.
   *
   * @param userId - User ID
   */
  async invalidateToken(userId: string): Promise<void> {
    try {
      const key = `igdb:token:${userId}`;
      await this.redis.del(key);
    } catch {
      // Ignore cache errors
    }
  }
}
