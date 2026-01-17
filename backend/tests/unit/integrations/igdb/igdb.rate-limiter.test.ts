import { describe, it, expect, beforeEach } from "bun:test";
import "reflect-metadata";

import { IgdbRateLimiter } from "@/integrations/igdb/igdb.rate-limiter";

describe("IgdbRateLimiter", () => {
  let limiter: IgdbRateLimiter;

  beforeEach(() => {
    limiter = new IgdbRateLimiter();
  });

  describe("schedule", () => {
    it("should execute a single request immediately", async () => {
      const result = await limiter.schedule(async () => "success");
      expect(result).toBe("success");
    });

    it("should enforce rate limit between requests", async () => {
      const start = Date.now();

      await limiter.schedule(async () => "first");
      await limiter.schedule(async () => "second");

      const elapsed = Date.now() - start;
      // Should take at least 250ms due to rate limit (4 req/sec = 250ms interval)
      expect(elapsed).toBeGreaterThanOrEqual(240); // Allow 10ms tolerance
    });

    it("should handle async functions correctly", async () => {
      const result = await limiter.schedule(async () => {
        await new Promise((r) => setTimeout(r, 10));
        return 42;
      });
      expect(result).toBe(42);
    });

    it("should propagate errors from scheduled functions", async () => {
      await expect(
        limiter.schedule(async () => {
          throw new Error("Test error");
        })
      ).rejects.toThrow("Test error");
    });

    it("should process requests in order", async () => {
      const order: number[] = [];

      const promises = [
        limiter.schedule(async () => order.push(1)),
        limiter.schedule(async () => order.push(2)),
        limiter.schedule(async () => order.push(3)),
      ];

      await Promise.all(promises);
      expect(order).toEqual([1, 2, 3]);
    });
  });
});
