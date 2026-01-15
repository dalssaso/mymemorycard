import { beforeEach, describe, expect, it } from "bun:test";
import "reflect-metadata";

import { PostgresPreferencesRepository } from "@/features/preferences/repositories/preferences.repository";
import type { UpdatePreferencesInput, UserPreference } from "@/features/preferences/types";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import {
  createMockDrizzleDB,
  mockSelectWhereError,
  mockSelectWhereResult,
  mockUpsertError,
  mockUpsertResult,
} from "@/tests/helpers/drizzle.mocks";

describe("PostgresPreferencesRepository", () => {
  let repository: PostgresPreferencesRepository;
  let mockDb: DrizzleDB;

  beforeEach(() => {
    mockDb = createMockDrizzleDB();
    repository = new PostgresPreferencesRepository(mockDb);
  });

  describe("findByUserId", () => {
    it("returns null when no preferences found", async () => {
      mockSelectWhereResult(mockDb, []);

      const result = await repository.findByUserId("user-123");

      expect(result).toBeNull();
    });

    it("returns preferences when found", async () => {
      const preferences: UserPreference = {
        userId: "user-123",
        defaultView: "table",
        itemsPerPage: 50,
        theme: "light",
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      };

      mockSelectWhereResult(mockDb, [preferences]);

      const result = await repository.findByUserId("user-123");

      expect(result).toEqual(preferences);
    });

    it("returns first result when multiple exist", async () => {
      const preferences: UserPreference[] = [
        {
          userId: "user-123",
          defaultView: "grid",
          itemsPerPage: 25,
          theme: "dark",
          updatedAt: new Date("2024-01-15T10:00:00Z"),
        },
        {
          userId: "user-123",
          defaultView: "table",
          itemsPerPage: 50,
          theme: "light",
          updatedAt: new Date("2024-01-14T10:00:00Z"),
        },
      ];

      mockSelectWhereResult(mockDb, preferences);

      const result = await repository.findByUserId("user-123");

      expect(result).toEqual(preferences[0]);
    });

    it("propagates database errors", async () => {
      mockSelectWhereError(mockDb, new Error("connection timeout"));

      await expect(repository.findByUserId("user-123")).rejects.toThrow("connection timeout");
    });
  });

  describe("upsert", () => {
    it("creates preferences with provided values", async () => {
      const preferences: UserPreference = {
        userId: "user-123",
        defaultView: "table",
        itemsPerPage: 50,
        theme: "dark",
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      };

      mockUpsertResult(mockDb, [preferences]);

      const input: UpdatePreferencesInput = {
        defaultView: "table",
        itemsPerPage: 50,
      };
      const result = await repository.upsert("user-123", input);

      expect(result).toEqual(preferences);
    });

    it("creates preferences with defaults when empty input", async () => {
      const preferences: UserPreference = {
        userId: "user-456",
        defaultView: "grid",
        itemsPerPage: 25,
        theme: "dark",
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      };

      mockUpsertResult(mockDb, [preferences]);

      const result = await repository.upsert("user-456", {});

      expect(result).toEqual(preferences);
    });

    it("updates preferences with partial input", async () => {
      const preferences: UserPreference = {
        userId: "user-789",
        defaultView: "grid",
        itemsPerPage: 100,
        theme: "light",
        updatedAt: new Date("2024-01-15T12:00:00Z"),
      };

      mockUpsertResult(mockDb, [preferences]);

      const input: UpdatePreferencesInput = {
        itemsPerPage: 100,
        theme: "light",
      };
      const result = await repository.upsert("user-789", input);

      expect(result).toEqual(preferences);
      expect(result.itemsPerPage).toBe(100);
      expect(result.theme).toBe("light");
    });

    it("propagates database errors", async () => {
      mockUpsertError(mockDb, new Error("constraint violation"));

      await expect(repository.upsert("user-123", { theme: "auto" })).rejects.toThrow(
        "constraint violation"
      );
    });
  });
});
