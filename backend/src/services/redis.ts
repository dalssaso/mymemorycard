/**
 * @deprecated Use RedisConnection from @/infrastructure/redis instead.
 * This module exists for legacy routes that haven't been migrated to DI.
 * Will be removed once all routes use DI patterns.
 */
import { createClient, type RedisClientType } from "redis";

// Legacy Redis connection using environment variables directly
// This is used by legacy code before DI migration is complete

let redisClient: RedisClientType | null = null;

/**
 * Get or create the Redis client.
 * Lazily initializes the client on first call to avoid errors during
 * OpenAPI generation when REDIS_URL is not set.
 */
export function getRedisClient(): RedisClientType {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("Missing required environment variable: REDIS_URL");
  }

  const skipRedisConnect = process.env.SKIP_REDIS_CONNECT === "1";

  redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on("error", (err) => console.error("Redis Client Error:", err));
  redisClient.on("connect", () => console.log("Connected to Redis"));

  if (!skipRedisConnect) {
    redisClient.connect().catch((err) => {
      console.error("Failed to connect to Redis:", err);
    });
  }

  return redisClient;
}

// Default export for backwards compatibility with existing code
// Uses a Proxy to lazily initialize on first access
const redisProxy = new Proxy({} as RedisClientType, {
  get(_target, prop) {
    const client = getRedisClient();
    const value = client[prop as keyof RedisClientType];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export default redisProxy;
