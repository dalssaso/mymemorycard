import { createClient } from "redis";

// Legacy Redis connection using environment variables directly
// This is used by legacy code before DI migration is complete
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("Missing required environment variable: REDIS_URL");
}

const skipRedisConnect = process.env.SKIP_REDIS_CONNECT === "1";

const redisClient = createClient({
  url: redisUrl,
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));
redisClient.on("connect", () => console.log("Connected to Redis"));

if (!skipRedisConnect) {
  redisClient.connect().catch((err) => {
    console.error("Failed to connect to Redis:", err);
  });
}

export default redisClient;
