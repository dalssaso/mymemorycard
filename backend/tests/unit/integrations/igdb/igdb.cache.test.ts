import { describe, it, expect, beforeEach, mock } from "bun:test";
import "reflect-metadata";

import { IgdbCache, TOKEN_EXPIRY_BUFFER } from "@/integrations/igdb/igdb.cache";
import type { IgdbGame } from "@/integrations/igdb/igdb.types";

/**
 * Create a mock Redis client for testing.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createMockRedis() {
  return {
    get: mock().mockResolvedValue(null),
    setEx: mock().mockResolvedValue("OK"),
    del: mock().mockResolvedValue(1),
  };
}

const testGame: IgdbGame = {
  id: 12345,
  name: "Test Game",
  slug: "test-game",
};

describe("IgdbCache", () => {
  let cache: IgdbCache;
  let mockRedis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    mockRedis = createMockRedis();
    cache = new IgdbCache(mockRedis as never);
  });

  describe("getCachedSearch", () => {
    it("should return null when cache miss", async () => {
      const result = await cache.getCachedSearch("test query");
      expect(result).toBeNull();
      // Key is normalized (trimmed, lowercase, collapsed whitespace)
      expect(mockRedis.get).toHaveBeenCalledWith("igdb:search:test query");
    });

    it("should return parsed games on cache hit", async () => {
      mockRedis.get = mock().mockResolvedValue(JSON.stringify([testGame]));

      const result = await cache.getCachedSearch("test query");
      expect(result).toEqual([testGame]);
    });

    it("should return null on parse error", async () => {
      mockRedis.get = mock().mockResolvedValue("invalid json");

      const result = await cache.getCachedSearch("test query");
      expect(result).toBeNull();
    });

    it("should normalize query with extra whitespace", async () => {
      await cache.getCachedSearch("  Test   Query  ");
      expect(mockRedis.get).toHaveBeenCalledWith("igdb:search:test query");
    });

    it("should normalize query with uppercase", async () => {
      await cache.getCachedSearch("TEST QUERY");
      expect(mockRedis.get).toHaveBeenCalledWith("igdb:search:test query");
    });
  });

  describe("cacheSearch", () => {
    it("should cache search results with TTL", async () => {
      await cache.cacheSearch("test query", [testGame]);

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        "igdb:search:test query",
        expect.any(Number),
        JSON.stringify([testGame])
      );
    });

    it("should use normalized query key matching getCachedSearch", async () => {
      await cache.cacheSearch("  Test   Query  ", [testGame]);

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        "igdb:search:test query",
        expect.any(Number),
        JSON.stringify([testGame])
      );
    });
  });

  describe("getCachedGameDetails", () => {
    it("should return null when cache miss", async () => {
      const result = await cache.getCachedGameDetails(12345);
      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith("igdb:game:12345");
    });

    it("should return parsed game on cache hit", async () => {
      mockRedis.get = mock().mockResolvedValue(JSON.stringify(testGame));

      const result = await cache.getCachedGameDetails(12345);
      expect(result).toEqual(testGame);
    });
  });

  describe("cacheGameDetails", () => {
    it("should cache game details with TTL", async () => {
      await cache.cacheGameDetails(12345, testGame);

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        "igdb:game:12345",
        expect.any(Number),
        JSON.stringify(testGame)
      );
    });
  });

  describe("getCachedPlatform", () => {
    it("should use correct key pattern", async () => {
      await cache.getCachedPlatform(6);
      expect(mockRedis.get).toHaveBeenCalledWith("igdb:platform:6");
    });
  });

  describe("cachePlatform", () => {
    it("should cache platform with correct key and TTL", async () => {
      const testPlatform = { id: 6, name: "PC", slug: "pc" };

      await cache.cachePlatform(6, testPlatform);

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        "igdb:platform:6",
        expect.any(Number),
        JSON.stringify(testPlatform)
      );
    });
  });

  describe("getCachedToken", () => {
    it("should return null when cache miss", async () => {
      const result = await cache.getCachedToken("user-123");
      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith("igdb:token:user-123");
    });

    it("should return token on cache hit", async () => {
      mockRedis.get = mock().mockResolvedValue("test-access-token");

      const result = await cache.getCachedToken("user-123");
      expect(result).toBe("test-access-token");
    });

    it("should return null on Redis error", async () => {
      mockRedis.get = mock().mockRejectedValue(new Error("Redis error"));

      const result = await cache.getCachedToken("user-123");
      expect(result).toBeNull();
    });
  });

  describe("cacheToken", () => {
    it("should cache token with TTL based on expiry minus buffer", async () => {
      await cache.cacheToken("user-123", "test-token", 5184000);

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        "igdb:token:user-123",
        expect.any(Number),
        "test-token"
      );

      // TTL should be less than expiresIn due to buffer
      const actualTtl = mockRedis.setEx.mock.calls[0][1] as number;
      expect(actualTtl).toBeLessThan(5184000);
      expect(actualTtl).toBeGreaterThan(0);
    });

    it("should skip caching when expiresIn is less than or equal to buffer", async () => {
      // When expiresIn <= TOKEN_EXPIRY_BUFFER, should skip caching entirely
      await cache.cacheToken("user-123", "test-token", TOKEN_EXPIRY_BUFFER);

      expect(mockRedis.setEx).not.toHaveBeenCalled();
    });

    it("should not throw on Redis error", async () => {
      mockRedis.setEx = mock().mockRejectedValue(new Error("Redis error"));

      const result = await cache.cacheToken("user-123", "test-token", 5184000);
      expect(result).toBeUndefined();
    });
  });

  describe("invalidateToken", () => {
    it("should delete token from cache", async () => {
      await cache.invalidateToken("user-123");
      expect(mockRedis.del).toHaveBeenCalledWith("igdb:token:user-123");
    });

    it("should not throw on Redis error", async () => {
      mockRedis.del = mock().mockRejectedValue(new Error("Redis error"));

      const result = await cache.invalidateToken("user-123");
      expect(result).toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("should return null on Redis get error", async () => {
      mockRedis.get = mock().mockRejectedValue(new Error("Redis error"));

      const result = await cache.getCachedSearch("test");
      expect(result).toBeNull();
    });

    it("should not throw on Redis set error", async () => {
      mockRedis.setEx = mock().mockRejectedValue(new Error("Redis error"));

      // Should complete without throwing
      const result = await cache.cacheSearch("test", [testGame]);
      expect(result).toBeUndefined();
    });
  });
});
