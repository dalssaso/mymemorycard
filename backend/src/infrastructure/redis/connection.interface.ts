import type { RedisClientType } from "redis";

/**
 * Interface for Redis connection management.
 * Provides typed access to Redis client with lifecycle methods.
 */
export interface IRedisConnection {
  /**
   * Check if connection should be skipped (for OpenAPI generation).
   */
  readonly shouldSkipConnect: boolean;

  /**
   * Get the Redis client instance.
   * Lazily connects on first access if not already connected.
   */
  getClient(): Promise<RedisClientType>;

  /**
   * Check if Redis connection is healthy.
   * @returns true if connected and responsive, false otherwise
   */
  healthCheck(): Promise<boolean>;

  /**
   * Gracefully close the Redis connection.
   */
  close(): Promise<void>;
}
