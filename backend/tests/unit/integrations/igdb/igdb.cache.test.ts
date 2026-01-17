import { describe, it, expect, beforeEach, mock } from "bun:test";
import "reflect-metadata";

import { IgdbCache } from "@/integrations/igdb/igdb.cache";
import type { IgdbGame } from "@/integrations/igdb/igdb.types";

describe("IgdbCache", () => {
  let cache: IgdbCache;
  let mockRedis: {
    get: ReturnType<typeof mock>;
    setEx: ReturnType<typeof mock>;
    del: ReturnType<typeof mock>;
  };

  const testGame: IgdbGame = {
    id: 12345,
    name: "Test Game",
    slug: "test-game",
  };

  beforeEach(() => {
    mockRedis = {
      get: mock().mockResolvedValue(null),
      setEx: mock().mockResolvedValue("OK"),
      del: mock().mockResolvedValue(1),
    };
    cache = new IgdbCache(mockRedis as never);
  });

  describe("getCachedSearch", () => {
    it("should return null when cache miss", async () => {
      const result = await cache.getCachedSearch("test query");
      expect(result).toBeNull();
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
