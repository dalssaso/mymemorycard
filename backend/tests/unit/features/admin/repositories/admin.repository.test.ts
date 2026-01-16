import { beforeEach, describe, expect, it } from "bun:test";
import "reflect-metadata";

import { PostgresAdminRepository } from "@/features/admin/repositories/admin.repository";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import {
  createMockDrizzleDB,
  mockSelectLimitError,
  mockSelectLimitResult,
  mockUpsertError,
  mockUpsertResult,
} from "@/tests/helpers/drizzle.mocks";

describe("PostgresAdminRepository", () => {
  let repository: PostgresAdminRepository;
  let mockDb: DrizzleDB;

  beforeEach(() => {
    mockDb = createMockDrizzleDB();
    repository = new PostgresAdminRepository(mockDb);
  });

  describe("findSettings", () => {
    it("returns null when no settings exist", async () => {
      mockSelectLimitResult(mockDb, []);

      const result = await repository.findSettings();

      expect(result).toBeNull();
    });

    it("returns settings when they exist", async () => {
      const settings = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        analyticsEnabled: true,
        analyticsProvider: "umami" as const,
        analyticsKey: "test-key",
        analyticsHost: "https://analytics.example.com",
        searchServerSide: false,
        searchDebounceMs: 500,
        updatedAt: new Date("2026-01-15T10:00:00Z"),
      };

      mockSelectLimitResult(mockDb, [settings]);

      const result = await repository.findSettings();

      expect(result).toEqual(settings);
    });

    it("propagates database errors", async () => {
      mockSelectLimitError(mockDb, new Error("connection timeout"));

      await expect(repository.findSettings()).rejects.toThrow("connection timeout");
    });
  });

  describe("upsert", () => {
    it("creates or updates settings atomically", async () => {
      const newSettings = {
        id: "00000000-0000-0000-0000-000000000001",
        analyticsEnabled: true,
        analyticsProvider: "plausible" as const,
        analyticsKey: "new-key",
        analyticsHost: "https://plausible.example.com",
        searchServerSide: true,
        searchDebounceMs: 300,
        updatedAt: new Date("2026-01-15T11:00:00Z"),
      };

      mockUpsertResult(mockDb, [newSettings]);

      const result = await repository.upsert({
        analyticsEnabled: true,
        analyticsProvider: "plausible",
        analyticsKey: "new-key",
        analyticsHost: "https://plausible.example.com",
      });

      expect(result).toEqual(newSettings);
    });

    it("handles partial updates", async () => {
      const updated = {
        id: "00000000-0000-0000-0000-000000000001",
        analyticsEnabled: false,
        analyticsProvider: null,
        analyticsKey: null,
        analyticsHost: null,
        searchServerSide: true,
        searchDebounceMs: 500,
        updatedAt: new Date("2026-01-15T12:00:00Z"),
      };

      mockUpsertResult(mockDb, [updated]);

      const result = await repository.upsert({ searchDebounceMs: 500 });

      expect(result.searchDebounceMs).toBe(500);
    });

    it("throws error when upsert returns empty array", async () => {
      mockUpsertResult(mockDb, []);

      await expect(repository.upsert({ analyticsEnabled: true })).rejects.toThrow(
        "Admin settings upsert failed to return a row"
      );
    });

    it("propagates database errors", async () => {
      mockUpsertError(mockDb, new Error("constraint violation"));

      await expect(repository.upsert({ analyticsEnabled: true })).rejects.toThrow(
        "constraint violation"
      );
    });
  });
});
