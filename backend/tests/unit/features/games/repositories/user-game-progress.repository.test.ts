import { beforeEach, describe, expect, it, mock } from "bun:test";
import "reflect-metadata";

import { UserGameProgressRepository } from "@/features/games/repositories/user-game-progress.repository";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import { createMockDrizzleDB } from "@/tests/helpers/drizzle.mocks";

describe("UserGameProgressRepository", () => {
  let repository: UserGameProgressRepository;
  let mockDb: DrizzleDB;

  beforeEach(() => {
    mockDb = createMockDrizzleDB();
    repository = new UserGameProgressRepository(mockDb);
  });

  describe("findByGameAndPlatform", () => {
    it("returns null when progress not found", async () => {
      const mockQuery = {
        userGameProgress: {
          findFirst: async () => null,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findByGameAndPlatform("user-id", "game-id", "platform-id");

      expect(result).toBeNull();
    });

    it("returns mapped progress when found", async () => {
      const mockProgress = {
        userId: "user-id",
        gameId: "game-id",
        platformId: "platform-id",
        status: "playing",
        userRating: 8,
        notes: "Great game",
        isFavorite: true,
        startedAt: new Date("2024-06-15"),
        completedAt: null,
      };

      const mockQuery = {
        userGameProgress: {
          findFirst: async () => mockProgress,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findByGameAndPlatform("user-id", "game-id", "platform-id");

      expect(result).not.toBeNull();
      expect(result?.user_id).toBe("user-id");
      expect(result?.game_id).toBe("game-id");
      expect(result?.platform_id).toBe("platform-id");
      expect(result?.status).toBe("playing");
      expect(result?.user_rating).toBe(8);
      expect(result?.notes).toBe("Great game");
      expect(result?.is_favorite).toBe(true);
      expect(result?.started_at).toEqual(new Date("2024-06-15"));
      expect(result?.completed_at).toBeNull();
    });

    it("handles date string conversion from database", async () => {
      const mockProgress = {
        userId: "user-id",
        gameId: "game-id",
        platformId: "platform-id",
        status: "finished",
        userRating: 9,
        notes: null,
        isFavorite: false,
        startedAt: "2024-01-01",
        completedAt: "2024-06-15",
      };

      const mockQuery = {
        userGameProgress: {
          findFirst: async () => mockProgress,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findByGameAndPlatform("user-id", "game-id", "platform-id");

      expect(result?.started_at).toEqual(new Date("2024-01-01"));
      expect(result?.completed_at).toEqual(new Date("2024-06-15"));
    });
  });

  describe("updateStatus", () => {
    it("calls insert with upsert for status update", async () => {
      const mockOnConflictDoUpdate = mock().mockResolvedValue(undefined);
      const mockValues = mock().mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate,
      });
      const mockInsert = mock().mockReturnValue({
        values: mockValues,
      });

      Object.defineProperty(mockDb, "insert", {
        value: mockInsert,
        writable: true,
      });

      await repository.updateStatus("user-id", "game-id", "platform-id", "playing");

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });

    it("calls insert with upsert for finished status", async () => {
      const mockOnConflictDoUpdate = mock().mockResolvedValue(undefined);
      const mockValues = mock().mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate,
      });
      const mockInsert = mock().mockReturnValue({
        values: mockValues,
      });

      Object.defineProperty(mockDb, "insert", {
        value: mockInsert,
        writable: true,
      });

      await repository.updateStatus("user-id", "game-id", "platform-id", "finished");

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });

    it("calls insert with upsert for completed status", async () => {
      const mockOnConflictDoUpdate = mock().mockResolvedValue(undefined);
      const mockValues = mock().mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate,
      });
      const mockInsert = mock().mockReturnValue({
        values: mockValues,
      });

      Object.defineProperty(mockDb, "insert", {
        value: mockInsert,
        writable: true,
      });

      await repository.updateStatus("user-id", "game-id", "platform-id", "completed");

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });
  });

  describe("updateRating", () => {
    it("calls insert with upsert for rating update", async () => {
      const mockOnConflictDoUpdate = mock().mockResolvedValue(undefined);
      const mockValues = mock().mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate,
      });
      const mockInsert = mock().mockReturnValue({
        values: mockValues,
      });

      Object.defineProperty(mockDb, "insert", {
        value: mockInsert,
        writable: true,
      });

      await repository.updateRating("user-id", "game-id", "platform-id", 8);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });
  });

  describe("updateNotes", () => {
    it("calls insert with upsert for notes update", async () => {
      const mockOnConflictDoUpdate = mock().mockResolvedValue(undefined);
      const mockValues = mock().mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate,
      });
      const mockInsert = mock().mockReturnValue({
        values: mockValues,
      });

      Object.defineProperty(mockDb, "insert", {
        value: mockInsert,
        writable: true,
      });

      await repository.updateNotes("user-id", "game-id", "platform-id", "Great game!");

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });
  });

  describe("updateFavorite", () => {
    it("calls insert with upsert for favorite true", async () => {
      const mockOnConflictDoUpdate = mock().mockResolvedValue(undefined);
      const mockValues = mock().mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate,
      });
      const mockInsert = mock().mockReturnValue({
        values: mockValues,
      });

      Object.defineProperty(mockDb, "insert", {
        value: mockInsert,
        writable: true,
      });

      await repository.updateFavorite("user-id", "game-id", "platform-id", true);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });

    it("calls insert with upsert for favorite false", async () => {
      const mockOnConflictDoUpdate = mock().mockResolvedValue(undefined);
      const mockValues = mock().mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate,
      });
      const mockInsert = mock().mockReturnValue({
        values: mockValues,
      });

      Object.defineProperty(mockDb, "insert", {
        value: mockInsert,
        writable: true,
      });

      await repository.updateFavorite("user-id", "game-id", "platform-id", false);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });
  });

  describe("getCustomFields", () => {
    it("returns null when custom fields not found", async () => {
      const mockQuery = {
        userGameCustomFields: {
          findFirst: async () => null,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.getCustomFields("user-id", "game-id", "platform-id");

      expect(result).toBeNull();
    });

    it("returns mapped custom fields when found", async () => {
      const mockCustomFields = {
        userId: "user-id",
        gameId: "game-id",
        platformId: "platform-id",
        completionPercentage: 75,
        difficultyRating: 4,
        updatedAt: new Date("2024-06-15"),
      };

      const mockQuery = {
        userGameCustomFields: {
          findFirst: async () => mockCustomFields,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.getCustomFields("user-id", "game-id", "platform-id");

      expect(result).not.toBeNull();
      expect(result?.user_id).toBe("user-id");
      expect(result?.game_id).toBe("game-id");
      expect(result?.platform_id).toBe("platform-id");
      expect(result?.completion_percentage).toBe(75);
      expect(result?.difficulty_rating).toBe(4);
      expect(result?.updated_at).toEqual(new Date("2024-06-15"));
    });

    it("handles null values in custom fields", async () => {
      const mockCustomFields = {
        userId: "user-id",
        gameId: "game-id",
        platformId: "platform-id",
        completionPercentage: null,
        difficultyRating: null,
        updatedAt: null,
      };

      const mockQuery = {
        userGameCustomFields: {
          findFirst: async () => mockCustomFields,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.getCustomFields("user-id", "game-id", "platform-id");

      expect(result?.completion_percentage).toBeNull();
      expect(result?.difficulty_rating).toBeNull();
      expect(result?.updated_at).toBeNull();
    });
  });

  describe("updateCustomFields", () => {
    it("calls insert with upsert for completion percentage", async () => {
      const mockOnConflictDoUpdate = mock().mockResolvedValue(undefined);
      const mockValues = mock().mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate,
      });
      const mockInsert = mock().mockReturnValue({
        values: mockValues,
      });

      Object.defineProperty(mockDb, "insert", {
        value: mockInsert,
        writable: true,
      });

      await repository.updateCustomFields("user-id", "game-id", "platform-id", {
        completion_percentage: 50,
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });

    it("calls insert with upsert for difficulty rating", async () => {
      const mockOnConflictDoUpdate = mock().mockResolvedValue(undefined);
      const mockValues = mock().mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate,
      });
      const mockInsert = mock().mockReturnValue({
        values: mockValues,
      });

      Object.defineProperty(mockDb, "insert", {
        value: mockInsert,
        writable: true,
      });

      await repository.updateCustomFields("user-id", "game-id", "platform-id", {
        difficulty_rating: 3,
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });

    it("calls insert with upsert for both fields", async () => {
      const mockOnConflictDoUpdate = mock().mockResolvedValue(undefined);
      const mockValues = mock().mockReturnValue({
        onConflictDoUpdate: mockOnConflictDoUpdate,
      });
      const mockInsert = mock().mockReturnValue({
        values: mockValues,
      });

      Object.defineProperty(mockDb, "insert", {
        value: mockInsert,
        writable: true,
      });

      await repository.updateCustomFields("user-id", "game-id", "platform-id", {
        completion_percentage: 100,
        difficulty_rating: 5,
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });
  });
});
