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
  private closing = false;
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
        // Connection failed - error will be thrown to caller
        // Note: this.client is only assigned after successful connect(),
        // so no cleanup needed here
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
   * Handles in-flight connections by waiting for them to complete before closing.
   */
  async close(): Promise<void> {
    this.closing = true;

    try {
      // Wait for any in-flight connection to complete
      if (this.connecting) {
        try {
          await this.connecting;
        } catch {
          // Ignore connection errors during close - we're shutting down anyway
        }
      }

      if (this.client) {
        await this.client.quit();
        this.client = null;
        this.logger.info("Redis connection closed successfully");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to close Redis connection", message);
      throw error;
    } finally {
      this.closing = false;
      this.connecting = null;
    }
  }

  private async connect(): Promise<RedisClientType> {
    // Reject if close() was called
    if (this.closing) {
      throw new Error("Connection is closing");
    }

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

    // If close() was called while connecting, shut down immediately
    if (this.closing) {
      try {
        await client.quit();
      } catch (quitError) {
        // Log but don't let quit error mask the intended error
        const message = quitError instanceof Error ? quitError.message : String(quitError);
        this.logger.debug("Error during cleanup quit", message);
      }
      throw new Error("Connection closed during connect");
    }

    this.client = client as RedisClientType;
    return this.client;
  }
}
