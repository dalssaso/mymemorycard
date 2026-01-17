import { createClient, type RedisClientType } from "redis";
import { injectable, inject } from "tsyringe";
import type { IConfig } from "@/infrastructure/config/config.interface";
import type { IRedisConnection } from "./connection.interface";
import { CONFIG_TOKEN } from "@/container/tokens";
import { Logger } from "@/infrastructure/logging/logger";

/**
 * RedisConnection manages the Redis client lifecycle.
 * Receives configuration via DI injection.
 * Supports lazy connection for OpenAPI generation scenarios.
 */
@injectable()
export class RedisConnection implements IRedisConnection {
  readonly shouldSkipConnect: boolean;

  private client: RedisClientType | null = null;
  private connecting: Promise<RedisClientType> | null = null;
  private readonly logger: Logger;
  private readonly redisUrl: string;

  constructor(@inject(CONFIG_TOKEN) config: IConfig, @inject(Logger) logger: Logger) {
    this.redisUrl = config.redis.url;
    this.shouldSkipConnect = config.skipRedisConnect;
    this.logger = logger.child("RedisConnection");
  }

  /**
   * Get or create the Redis client.
   * Lazily connects on first access.
   * Returns same client instance on subsequent calls.
   */
  async getClient(): Promise<RedisClientType> {
    if (this.client) {
      return this.client;
    }

    // Prevent multiple concurrent connection attempts
    if (this.connecting) {
      return this.connecting;
    }

    const connectPromise = this.connect();
    this.connecting = connectPromise;

    connectPromise
      .catch(() => {
        // Clean up partially-created client on failure
        if (this.client) {
          this.client.quit().catch(() => {
            // Ignore cleanup errors
          });
          this.client = null;
        }
      })
      .finally(() => {
        // Clear connecting only if it still equals this promise (allows retry)
        if (this.connecting === connectPromise) {
          this.connecting = null;
        }
      });

    return connectPromise;
  }

  /**
   * Check if Redis connection is healthy.
   * @returns true if connected and responsive, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (this.shouldSkipConnect) {
        return true;
      }
      const client = await this.getClient();
      await client.ping();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error("Redis health check failed", message, stack);
      return false;
    }
  }

  /**
   * Gracefully close the Redis connection.
   */
  async close(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
        this.logger.info("Redis connection closed successfully");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to close Redis connection", message);
      throw error;
    }
  }

  private async connect(): Promise<RedisClientType> {
    const client = createClient({ url: this.redisUrl });

    client.on("error", (err) => {
      this.logger.error("Redis client error", err.message, err.stack);
    });

    client.on("connect", () => {
      this.logger.info("Connected to Redis");
    });

    if (!this.shouldSkipConnect) {
      await client.connect();
    }

    this.client = client as RedisClientType;
    return this.client;
  }
}
