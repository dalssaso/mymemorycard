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
 * Buffer time to subtract from token expiry (in seconds).
 * Ensures token is refreshed before actual expiration.
 */
export const TOKEN_EXPIRY_BUFFER = 300;

/**
 * Normalize a search query for consistent cache keys.
 * Trims whitespace, collapses repeated spaces, and lowercases.
 *
 * @param query - Raw search query
 * @returns Normalized query string
 */
function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Validate that a parsed value is a valid IgdbGame.
 * Checks required fields: id (number), name (string), slug (string).
 */
function isValidIgdbGame(value: unknown): value is IgdbGame {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as IgdbGame).id === "number" &&
    typeof (value as IgdbGame).name === "string" &&
    typeof (value as IgdbGame).slug === "string"
  );
}

/**
 * Validate that a parsed value is an array of valid IgdbGame objects.
 */
function isValidIgdbGameArray(value: unknown): value is IgdbGame[] {
  return Array.isArray(value) && value.every(isValidIgdbGame);
}

/**
 * Validate that a parsed value is a valid IgdbPlatform.
 * Checks required fields: id (number), name (string), slug (string).
 */
function isValidIgdbPlatform(value: unknown): value is IgdbPlatform {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as IgdbPlatform).id === "number" &&
    typeof (value as IgdbPlatform).name === "string" &&
    typeof (value as IgdbPlatform).slug === "string"
  );
}

/**
 * Minimal Redis client interface for cache operations.
 */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  setEx(key: string, seconds: number, value: string): Promise<string>;
  del(key: string | string[]): Promise<number>;
}

/**
 * Factory function type for lazy Redis client resolution.
 */
export type RedisClientFactory = () => Promise<RedisClient>;

/**
 * Redis cache utilities for IGDB API responses.
 * Supports lazy Redis client initialization to avoid connection during OpenAPI generation.
 */
export class IgdbCache {
  private redisClient: RedisClient | null = null;
  private redisFactory: RedisClientFactory | null = null;
  private redisClientPromise: Promise<RedisClient> | null = null;

  /**
   * Create an IgdbCache instance.
   *
   * @param redisOrFactory - Either a Redis client directly, or a factory function for lazy loading
   */
  constructor(redisOrFactory: RedisClient | RedisClientFactory) {
    if (typeof redisOrFactory === "function") {
      this.redisFactory = redisOrFactory;
    } else {
      this.redisClient = redisOrFactory;
    }
  }

  /**
   * Get cached search results.
   *
   * @param query - Search query string
   * @returns Cached games or null if miss
   */
  async getCachedSearch(query: string): Promise<IgdbGame[] | null> {
    try {
      const redis = await this.getRedis();
      const key = `igdb:search:${normalizeQuery(query)}`;
      const cached = await redis.get(key);
      if (!cached) {
        return null;
      }
      const parsed: unknown = JSON.parse(cached);
      if (!isValidIgdbGameArray(parsed)) {
        // Evict corrupted entry
        await redis.del(key);
        return null;
      }
      return parsed;
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
      const redis = await this.getRedis();
      const key = `igdb:search:${normalizeQuery(query)}`;
      await redis.setEx(key, CACHE_TTL.search, JSON.stringify(games));
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
      const redis = await this.getRedis();
      const key = `igdb:game:${igdbId}`;
      const cached = await redis.get(key);
      if (!cached) {
        return null;
      }
      const parsed: unknown = JSON.parse(cached);
      if (!isValidIgdbGame(parsed)) {
        // Evict corrupted entry
        await redis.del(key);
        return null;
      }
      return parsed;
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
      const redis = await this.getRedis();
      const key = `igdb:game:${igdbId}`;
      await redis.setEx(key, CACHE_TTL.gameDetails, JSON.stringify(game));
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
      const redis = await this.getRedis();
      const key = `igdb:platform:${igdbId}`;
      const cached = await redis.get(key);
      if (!cached) {
        return null;
      }
      const parsed: unknown = JSON.parse(cached);
      if (!isValidIgdbPlatform(parsed)) {
        // Evict corrupted entry
        await redis.del(key);
        return null;
      }
      return parsed;
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
      const redis = await this.getRedis();
      const key = `igdb:platform:${igdbId}`;
      await redis.setEx(key, CACHE_TTL.platform, JSON.stringify(platform));
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
      const redis = await this.getRedis();
      const key = `igdb:token:${userId}`;
      return await redis.get(key);
    } catch {
      return null;
    }
  }

  /**
   * Cache access token.
   * Skips caching if token expires too soon to be useful.
   *
   * @param userId - User ID
   * @param token - Access token
   * @param expiresIn - Token TTL in seconds
   */
  async cacheToken(userId: string, token: string, expiresIn: number): Promise<void> {
    // Skip caching if token expires too soon to be useful
    if (expiresIn <= TOKEN_EXPIRY_BUFFER) {
      return;
    }

    try {
      const redis = await this.getRedis();
      const key = `igdb:token:${userId}`;
      // Cache for slightly less than expiry to ensure refresh before actual expiration
      const ttl = Math.min(expiresIn - TOKEN_EXPIRY_BUFFER, CACHE_TTL.token);
      await redis.setEx(key, ttl, token);
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
      const redis = await this.getRedis();
      const key = `igdb:token:${userId}`;
      await redis.del(key);
    } catch {
      // Ignore cache errors
    }
  }

  /**
   * Get the Redis client, resolving lazily if needed.
   * Prevents race conditions by ensuring only one connection attempt at a time.
   */
  private async getRedis(): Promise<RedisClient> {
    if (this.redisClient) {
      return this.redisClient;
    }

    // Return existing pending promise to prevent concurrent factory calls
    if (this.redisClientPromise) {
      return this.redisClientPromise;
    }

    if (!this.redisFactory) {
      throw new Error("No Redis client or factory provided");
    }

    this.redisClientPromise = this.redisFactory()
      .then((client) => {
        this.redisClient = client;
        this.redisClientPromise = null;
        return client;
      })
      .catch((error) => {
        this.redisClientPromise = null;
        throw error;
      });

    return this.redisClientPromise;
  }
}
