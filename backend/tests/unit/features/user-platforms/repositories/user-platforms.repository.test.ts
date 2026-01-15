import "reflect-metadata";
import { beforeEach, describe, expect, it } from "bun:test";
import { PostgresUserPlatformsRepository } from "@/features/user-platforms/repositories/user-platforms.repository";
import {
  createMockDrizzleDB,
  mockSelectResult,
  mockSelectAllResult,
  mockInsertResult,
  mockInsertError,
  mockSelectError,
  mockSelectAllError,
} from "@/tests/helpers/drizzle.mocks";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import type {
  CreateUserPlatformInput,
  UpdateUserPlatformInput,
  UserPlatform,
} from "@/features/user-platforms/types";

describe("PostgresUserPlatformsRepository", () => {
  let repository: PostgresUserPlatformsRepository;
  let mockDb: DrizzleDB;

  beforeEach(() => {
    mockDb = createMockDrizzleDB();
    repository = new PostgresUserPlatformsRepository(mockDb);
  });

  describe("findById", () => {
    it("should return user-platform if found", async () => {
      const mockUserPlatform: UserPlatform = {
        id: "up-1",
        userId: "user-1",
        platformId: "steam",
        username: "steampunk",
        iconUrl: "https://example.com/icon.png",
        profileUrl: "https://example.com/profile",
        notes: "My Steam account",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockSelectResult(mockDb, [mockUserPlatform]);

      const result = await repository.findById("up-1");

      expect(result).toEqual(mockUserPlatform);
    });

    it("should return null if user-platform not found", async () => {
      mockSelectResult(mockDb, []);

      const result = await repository.findById("nonexistent");

      expect(result).toBeNull();
    });

    it("should propagate database errors", async () => {
      const dbError = new Error("Connection refused");
      mockSelectError(mockDb, dbError);

      await expect(repository.findById("up-1")).rejects.toThrow("Connection refused");
    });
  });

  describe("findByUserId", () => {
    it("should find all platforms for a user", async () => {
      const mockUserPlatforms: UserPlatform[] = [
        {
          id: "up-1",
          userId: "user-1",
          platformId: "steam",
          username: "steampunk",
          iconUrl: "https://example.com/icon1.png",
          profileUrl: "https://example.com/profile1",
          notes: "Steam account",
          createdAt: new Date("2024-01-01T00:00:00Z"),
        },
        {
          id: "up-2",
          userId: "user-1",
          platformId: "psn",
          username: "psngamer",
          iconUrl: "https://example.com/icon2.png",
          profileUrl: "https://example.com/profile2",
          notes: "PSN account",
          createdAt: new Date("2024-01-02T00:00:00Z"),
        },
      ];

      mockSelectAllResult(mockDb, mockUserPlatforms);

      const result = await repository.findByUserId("user-1");

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockUserPlatforms);
    });

    it("should return empty array for user with no platforms", async () => {
      mockSelectAllResult(mockDb, []);

      const result = await repository.findByUserId("user-no-platforms");

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should propagate database errors", async () => {
      const dbError = new Error("Connection refused");
      mockSelectAllError(mockDb, dbError);

      await expect(repository.findByUserId("user-1")).rejects.toThrow("Connection refused");
    });
  });

  describe("findByUserAndPlatform", () => {
    it("should find user-platform by user and platform id", async () => {
      const mockUserPlatform: UserPlatform = {
        id: "up-1",
        userId: "user-1",
        platformId: "steam",
        username: "steampunk",
        iconUrl: "https://example.com/icon.png",
        profileUrl: "https://example.com/profile",
        notes: "Steam account",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockSelectResult(mockDb, [mockUserPlatform]);

      const result = await repository.findByUserAndPlatform("user-1", "steam");

      expect(result).toEqual(mockUserPlatform);
    });

    it("should return null if user-platform does not exist", async () => {
      mockSelectResult(mockDb, []);

      const result = await repository.findByUserAndPlatform("user-1", "nonexistent");

      expect(result).toBeNull();
    });

    it("should propagate database errors", async () => {
      const dbError = new Error("Connection refused");
      mockSelectError(mockDb, dbError);

      await expect(repository.findByUserAndPlatform("user-1", "steam")).rejects.toThrow(
        "Connection refused"
      );
    });
  });

  describe("create", () => {
    it("should create and return user-platform", async () => {
      const mockUserPlatform: UserPlatform = {
        id: "new-up-id",
        userId: "user-1",
        platformId: "steam",
        username: "steampunk",
        iconUrl: "https://example.com/icon.png",
        profileUrl: "https://example.com/profile",
        notes: "My Steam account",
        createdAt: new Date(),
      };

      mockInsertResult(mockDb, [mockUserPlatform]);

      const input: CreateUserPlatformInput = {
        platformId: "steam",
        username: "steampunk",
        iconUrl: "https://example.com/icon.png",
        profileUrl: "https://example.com/profile",
        notes: "My Steam account",
      };

      const result = await repository.create("user-1", input);

      expect(result).toEqual(mockUserPlatform);
    });

    it("should create user-platform with minimal fields", async () => {
      const mockUserPlatform: UserPlatform = {
        id: "new-up-id",
        userId: "user-2",
        platformId: "psn",
        username: null,
        iconUrl: null,
        profileUrl: null,
        notes: null,
        createdAt: new Date(),
      };

      mockInsertResult(mockDb, [mockUserPlatform]);

      const input: CreateUserPlatformInput = {
        platformId: "psn",
      };

      const result = await repository.create("user-2", input);

      expect(result).toEqual(mockUserPlatform);
    });

    it("should propagate database errors", async () => {
      const dbError = new Error("Connection refused");
      mockInsertError(mockDb, dbError);

      const input: CreateUserPlatformInput = {
        platformId: "steam",
      };

      await expect(repository.create("user-1", input)).rejects.toThrow("Connection refused");
    });
  });

  describe("update", () => {
    it("should update and return user-platform", async () => {
      const updatedUserPlatform: UserPlatform = {
        id: "up-1",
        userId: "user-1",
        platformId: "steam",
        username: "newusername",
        iconUrl: "https://example.com/new-icon.png",
        profileUrl: "https://example.com/profile",
        notes: "Updated notes",
        createdAt: new Date("2024-01-01T00:00:00Z"),
      };

      mockSelectResult(mockDb, [updatedUserPlatform]);

      const input: UpdateUserPlatformInput = {
        username: "newusername",
        iconUrl: "https://example.com/new-icon.png",
        notes: "Updated notes",
      };

      const result = await repository.update("up-1", input);

      expect(result).toEqual(updatedUserPlatform);
    });

    it("should return null if user-platform not found", async () => {
      mockSelectResult(mockDb, []);

      const input: UpdateUserPlatformInput = {
        username: "newusername",
      };

      const result = await repository.update("nonexistent", input);

      expect(result).toBeNull();
    });

    it("should propagate database errors", async () => {
      const dbError = new Error("Connection refused");
      mockSelectError(mockDb, dbError);

      const input: UpdateUserPlatformInput = {
        username: "newusername",
      };

      await expect(repository.update("up-1", input)).rejects.toThrow("Connection refused");
    });
  });

  describe("delete", () => {
    it("should delete user-platform by id", async () => {
      mockSelectResult(mockDb, [{ id: "up-1" }]);

      await expect(repository.delete("up-1")).resolves.toBeUndefined();
    });

    it("should return null if user-platform not found", async () => {
      mockSelectResult(mockDb, []);

      const result = await repository.delete("nonexistent");

      expect(result).toBeNull();
    });

    it("should propagate database errors", async () => {
      const dbError = new Error("Connection refused");
      mockSelectError(mockDb, dbError);

      await expect(repository.delete("up-1")).rejects.toThrow("Connection refused");
    });
  });

  describe("deleteByUserId", () => {
    it("should delete all platforms for user", async () => {
      await expect(repository.deleteByUserId("user-1")).resolves.toBeUndefined();
    });

    it("should propagate database errors", async () => {
      const dbError = new Error("Connection refused");
      mockSelectAllError(mockDb, dbError);

      await expect(repository.deleteByUserId("user-1")).rejects.toThrow("Connection refused");
    });
  });
});
