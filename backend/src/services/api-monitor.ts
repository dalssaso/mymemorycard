import redisClient from "./redis";

const COUNTER_KEY = "rawg:request_count";
const COUNTER_RESET_KEY = "rawg:request_count_reset";

export async function incrementRAWGRequestCount(): Promise<number> {
  try {
    // Check if we need to reset the counter (monthly)
    const resetTime = await redisClient.get(COUNTER_RESET_KEY);
    const now = new Date();

    if (!resetTime || new Date(resetTime) < now) {
      // Reset counter for new month
      await redisClient.set(COUNTER_KEY, "0");

      // Set next reset date (first day of next month)
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      await redisClient.set(COUNTER_RESET_KEY, nextReset.toISOString());
    }

    // Increment and return current count
    const count = await redisClient.incr(COUNTER_KEY);

    // Log warning if approaching limit
    if (count > 15000) {
      console.warn(`RAWG API usage high: ${count}/20000 requests this month`);
    }

    if (count > 19000) {
      console.error(`RAWG API usage critical: ${count}/20000 requests this month`);
    }

    return count;
  } catch (error) {
    console.error("Failed to increment RAWG request count:", error);
    return 0;
  }
}

export async function getRAWGRequestCount(): Promise<number> {
  try {
    const count = await redisClient.get(COUNTER_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error("Failed to get RAWG request count:", error);
    return 0;
  }
}

export async function getRAWGRequestStats(): Promise<{
  count: number;
  limit: number;
  resetDate: string | null;
  percentageUsed: number;
}> {
  try {
    const count = await getRAWGRequestCount();
    const resetTime = await redisClient.get(COUNTER_RESET_KEY);

    return {
      count,
      limit: 20000,
      resetDate: resetTime,
      percentageUsed: (count / 20000) * 100,
    };
  } catch (error) {
    console.error("Failed to get RAWG stats:", error);
    return {
      count: 0,
      limit: 20000,
      resetDate: null,
      percentageUsed: 0,
    };
  }
}
