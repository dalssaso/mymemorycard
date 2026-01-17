import { beforeEach, describe, expect, it } from "bun:test";
import "reflect-metadata";

import { UserGameRepository } from "@/features/games/repositories/user-game.repository";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import { ConflictError, NotFoundError } from "@/shared/errors/base";
import {
  createMockDrizzleDB,
  mockDeleteResult,
  mockInsertError,
  mockInsertResult,
  mockSelectJoinResult,
  mockUpdateResult,
} from "@/tests/helpers/drizzle.mocks";

describe("UserGameRepository", () => {
  let repository: UserGameRepository;
  let mockDb: DrizzleDB;

  beforeEach(() => {
    mockDb = createMockDrizzleDB();
    repository = new UserGameRepository(mockDb);
  });

  describe("findById", () => {
    it("returns null when user game not found", async () => {
      const mockQuery = {
        userGames: {
          findFirst: async () => null,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findById("non-existent-id");

      expect(result).toBeNull();
    });

    it("returns user game when found by id", async () => {
      const userGameRow = {
        id: "ug-123",
        userId: "user-123",
        gameId: "game-456",
        platformId: "platform-789",
        storeId: "store-001",
        platformGameId: "app-12345",
        owned: true,
        purchasedDate: "2024-01-15",
        importSource: "steam",
        createdAt: new Date("2024-01-15"),
      };

      const mockQuery = {
        userGames: {
          findFirst: async () => userGameRow,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findById("ug-123");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("ug-123");
      expect(result?.user_id).toBe("user-123");
      expect(result?.game_id).toBe("game-456");
    });
  });

  describe("findByIdWithRelations", () => {
    it("returns user game with relations when found", async () => {
      const joinResultRow = {
        id: "ug-rel-1",
        userId: "user-rel",
        gameId: "game-rel",
        platformId: "platform-rel",
        storeId: "store-rel",
        platformGameId: "steam-123",
        owned: true,
        purchasedDate: "2024-06-15",
        importSource: "steam",
        createdAt: new Date("2024-06-15"),
        gameName: "Test Game",
        gameCoverArtUrl: "https://example.com/cover.jpg",
        platformName: "PC",
        platformAbbreviation: "PC",
        storeSlug: "steam",
        storeDisplayName: "Steam",
      };

      mockSelectJoinResult(mockDb, [joinResultRow]);

      const result = await repository.findByIdWithRelations("ug-rel-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("ug-rel-1");
      expect(result?.user_id).toBe("user-rel");
      expect(result?.game.id).toBe("game-rel");
      expect(result?.game.name).toBe("Test Game");
      expect(result?.game.cover_art_url).toBe("https://example.com/cover.jpg");
      expect(result?.platform.id).toBe("platform-rel");
      expect(result?.platform.name).toBe("PC");
      expect(result?.platform.abbreviation).toBe("PC");
      expect(result?.store?.id).toBe("store-rel");
      expect(result?.store?.slug).toBe("steam");
      expect(result?.store?.display_name).toBe("Steam");
    });

    it("returns null when user game not found", async () => {
      mockSelectJoinResult(mockDb, []);

      const result = await repository.findByIdWithRelations("non-existent-id");

      expect(result).toBeNull();
    });

    it("handles null store when no store associated", async () => {
      const joinResultRow = {
        id: "ug-no-store",
        userId: "user-no-store",
        gameId: "game-no-store",
        platformId: "platform-no-store",
        storeId: null,
        platformGameId: null,
        owned: true,
        purchasedDate: null,
        importSource: null,
        createdAt: new Date("2024-06-15"),
        gameName: "Another Game",
        gameCoverArtUrl: null,
        platformName: "PlayStation 5",
        platformAbbreviation: "PS5",
        storeSlug: null,
        storeDisplayName: null,
      };

      mockSelectJoinResult(mockDb, [joinResultRow]);

      const result = await repository.findByIdWithRelations("ug-no-store");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("ug-no-store");
      expect(result?.store).toBeNull();
      expect(result?.game.cover_art_url).toBeNull();
      expect(result?.platform.abbreviation).toBe("PS5");
    });
  });

  describe("listByUserWithRelations", () => {
    it("returns array of user games with relations", async () => {
      const joinResultRows = [
        {
          id: "ug-list-rel-1",
          userId: "user-list-rel",
          gameId: "game-1",
          platformId: "platform-1",
          storeId: "store-1",
          platformGameId: "steam-111",
          owned: true,
          purchasedDate: "2024-01-01",
          importSource: "steam",
          createdAt: new Date("2024-01-01"),
          gameName: "Game One",
          gameCoverArtUrl: "https://example.com/one.jpg",
          platformName: "PC",
          platformAbbreviation: "PC",
          storeSlug: "steam",
          storeDisplayName: "Steam",
        },
        {
          id: "ug-list-rel-2",
          userId: "user-list-rel",
          gameId: "game-2",
          platformId: "platform-2",
          storeId: null,
          platformGameId: null,
          owned: true,
          purchasedDate: null,
          importSource: null,
          createdAt: new Date("2024-02-01"),
          gameName: "Game Two",
          gameCoverArtUrl: null,
          platformName: "PlayStation 5",
          platformAbbreviation: "PS5",
          storeSlug: null,
          storeDisplayName: null,
        },
      ];

      mockSelectJoinResult(mockDb, joinResultRows);

      const result = await repository.listByUserWithRelations("user-list-rel");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("ug-list-rel-1");
      expect(result[0].game.name).toBe("Game One");
      expect(result[0].platform.name).toBe("PC");
      expect(result[0].store?.slug).toBe("steam");
      expect(result[1].id).toBe("ug-list-rel-2");
      expect(result[1].game.name).toBe("Game Two");
      expect(result[1].platform.abbreviation).toBe("PS5");
      expect(result[1].store).toBeNull();
    });

    it("returns empty array when user has no games", async () => {
      mockSelectJoinResult(mockDb, []);

      const result = await repository.listByUserWithRelations("user-no-games");

      expect(result).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("creates a new user game entry", async () => {
      const newEntry = {
        id: "ug-new-1",
        userId: "user-111",
        gameId: "game-222",
        platformId: "platform-333",
        storeId: null,
        platformGameId: null,
        owned: true,
        purchasedDate: null,
        importSource: null,
        createdAt: new Date(),
      };

      mockInsertResult(mockDb, [newEntry]);

      const result = await repository.create({
        user_id: "user-111",
        game_id: "game-222",
        platform_id: "platform-333",
      });

      expect(result.user_id).toBe("user-111");
      expect(result.game_id).toBe("game-222");
      expect(result.platform_id).toBe("platform-333");
      expect(result.owned).toBe(true);
    });

    it("creates user game with all fields", async () => {
      const fullEntry = {
        id: "ug-full-1",
        userId: "user-444",
        gameId: "game-555",
        platformId: "platform-666",
        storeId: "store-777",
        platformGameId: "steam-app-999",
        owned: false,
        purchasedDate: "2023-06-01",
        importSource: "epic",
        createdAt: new Date(),
      };

      mockInsertResult(mockDb, [fullEntry]);

      const result = await repository.create({
        user_id: "user-444",
        game_id: "game-555",
        platform_id: "platform-666",
        store_id: "store-777",
        platform_game_id: "steam-app-999",
        owned: false,
        purchased_date: new Date("2023-06-01"),
        import_source: "epic",
      });

      expect(result.user_id).toBe("user-444");
      expect(result.owned).toBe(false);
      expect(result.store_id).toBe("store-777");
      expect(result.import_source).toBe("epic");
    });

    it("defaults owned to true when not provided", async () => {
      const entryRow = {
        id: "ug-owned-default",
        userId: "user-888",
        gameId: "game-999",
        platformId: "platform-aaa",
        storeId: null,
        platformGameId: null,
        owned: true,
        purchasedDate: null,
        importSource: null,
        createdAt: new Date(),
      };

      mockInsertResult(mockDb, [entryRow]);

      const result = await repository.create({
        user_id: "user-888",
        game_id: "game-999",
        platform_id: "platform-aaa",
      });

      expect(result.owned).toBe(true);
    });

    it("throws ConflictError on unique constraint violation", async () => {
      const error = new Error("duplicate key") as unknown as Record<string, unknown>;
      error.code = "23505";
      mockInsertError(mockDb, error as unknown as Error);

      expect(
        repository.create({
          user_id: "user-dup",
          game_id: "game-dup",
          platform_id: "platform-dup",
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("findByUserGamePlatform", () => {
    it("returns user game matching user, game, and platform", async () => {
      const userGameRow = {
        id: "ug-match-1",
        userId: "user-x1",
        gameId: "game-y1",
        platformId: "platform-z1",
        storeId: null,
        platformGameId: null,
        owned: true,
        purchasedDate: null,
        importSource: null,
        createdAt: new Date(),
      };

      const mockQuery = {
        userGames: {
          findFirst: async () => userGameRow,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findByUserGamePlatform("user-x1", "game-y1", "platform-z1");

      expect(result).not.toBeNull();
      expect(result?.user_id).toBe("user-x1");
      expect(result?.game_id).toBe("game-y1");
      expect(result?.platform_id).toBe("platform-z1");
    });

    it("returns null when combination not found", async () => {
      const mockQuery = {
        userGames: {
          findFirst: async () => null,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findByUserGamePlatform("user-x2", "game-y2", "platform-z2");

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("updates user game entry for authorized user", async () => {
      const existingEntry = {
        id: "ug-update-1",
        userId: "user-auth",
        gameId: "game-old",
        platformId: "platform-old",
        storeId: null,
        platformGameId: null,
        owned: true,
        purchasedDate: null,
        importSource: null,
        createdAt: new Date(),
      };

      const updatedEntry = {
        ...existingEntry,
        owned: false,
        platformGameId: "new-platform-id",
      };

      const mockQuery = {
        userGames: {
          findFirst: async () => existingEntry,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });
      mockUpdateResult(mockDb, [updatedEntry]);

      const result = await repository.update("ug-update-1", "user-auth", {
        owned: false,
        platform_game_id: "new-platform-id",
      });

      expect(result.owned).toBe(false);
      expect(result.platform_game_id).toBe("new-platform-id");
    });

    it("throws NotFoundError when entry not found", async () => {
      const mockQuery = {
        userGames: {
          findFirst: async () => null,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      expect(repository.update("ug-nonexistent", "user-auth", { owned: false })).rejects.toThrow(
        NotFoundError
      );
    });

    it("throws NotFoundError when user does not own entry (cross-user access)", async () => {
      const existingEntry = {
        id: "ug-cross-user",
        userId: "user-owner",
        gameId: "game-123",
        platformId: "platform-456",
        storeId: null,
        platformGameId: null,
        owned: true,
        purchasedDate: null,
        importSource: null,
        createdAt: new Date(),
      };

      const mockQuery = {
        userGames: {
          findFirst: async () => existingEntry,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      expect(repository.update("ug-cross-user", "user-attacker", { owned: false })).rejects.toThrow(
        NotFoundError
      );
    });

    it("updates multiple fields on user game entry", async () => {
      const existingEntry = {
        id: "ug-multi-1",
        userId: "user-multi",
        gameId: "game-multi",
        platformId: "platform-multi",
        storeId: null,
        platformGameId: null,
        owned: false,
        purchasedDate: null,
        importSource: null,
        createdAt: new Date(),
      };

      const updatedEntry = {
        ...existingEntry,
        owned: true,
        purchasedDate: "2024-01-20",
        storeId: "store-multi",
      };

      const mockQuery = {
        userGames: {
          findFirst: async () => existingEntry,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });
      mockUpdateResult(mockDb, [updatedEntry]);

      const result = await repository.update("ug-multi-1", "user-multi", {
        owned: true,
        purchased_date: new Date("2024-01-20"),
        store_id: "store-multi",
      });

      expect(result.owned).toBe(true);
      expect(result.store_id).toBe("store-multi");
    });
  });

  describe("delete", () => {
    it("successfully deletes user game for authorized user", async () => {
      const existingEntry = {
        id: "ug-del-1",
        userId: "user-del",
        gameId: "game-del",
        platformId: "platform-del",
        storeId: null,
        platformGameId: null,
        owned: true,
        purchasedDate: null,
        importSource: null,
        createdAt: new Date(),
      };

      const mockQuery = {
        userGames: {
          findFirst: async () => existingEntry,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });
      mockDeleteResult(mockDb, [existingEntry]);

      const result = await repository.delete("ug-del-1", "user-del");

      expect(result).toBe(true);
    });

    it("throws NotFoundError when entry does not exist", async () => {
      const mockQuery = {
        userGames: {
          findFirst: async () => null,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      expect(repository.delete("ug-nonexistent-del", "user-del")).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError on cross-user delete attempt", async () => {
      const existingEntry = {
        id: "ug-cross-del",
        userId: "user-owner",
        gameId: "game-cross-del",
        platformId: "platform-cross-del",
        storeId: null,
        platformGameId: null,
        owned: true,
        purchasedDate: null,
        importSource: null,
        createdAt: new Date(),
      };

      const mockQuery = {
        userGames: {
          findFirst: async () => existingEntry,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      expect(repository.delete("ug-cross-del", "user-attacker")).rejects.toThrow(NotFoundError);
    });
  });

  describe("listByUser", () => {
    it("lists user games for a specific user", async () => {
      const userGames = [
        {
          id: "ug-list-1",
          userId: "user-list",
          gameId: "game-1",
          platformId: "platform-1",
          storeId: null,
          platformGameId: null,
          owned: true,
          purchasedDate: null,
          importSource: null,
          createdAt: new Date(),
        },
        {
          id: "ug-list-2",
          userId: "user-list",
          gameId: "game-2",
          platformId: "platform-1",
          storeId: null,
          platformGameId: null,
          owned: true,
          purchasedDate: null,
          importSource: null,
          createdAt: new Date(),
        },
      ];

      const mockQuery = {
        userGames: {
          findMany: async () => userGames,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.listByUser("user-list");

      expect(result).toHaveLength(2);
      expect(result[0].user_id).toBe("user-list");
      expect(result[1].user_id).toBe("user-list");
    });

    it("returns empty array when user has no games", async () => {
      const mockQuery = {
        userGames: {
          findMany: async () => [],
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.listByUser("user-empty");

      expect(result).toHaveLength(0);
    });

    it("respects pagination parameters", async () => {
      const allGames = Array.from({ length: 30 }, (_, i) => ({
        id: `ug-page-${i}`,
        userId: "user-page",
        gameId: `game-${i}`,
        platformId: "platform-1",
        storeId: null,
        platformGameId: null,
        owned: true,
        purchasedDate: null,
        importSource: null,
        createdAt: new Date(),
      }));

      const mockQuery = {
        userGames: {
          findMany: async () => allGames.slice(10, 20),
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.listByUser("user-page", 10, 10);

      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  describe("getByGameForUser", () => {
    it("lists all user game entries for a specific game", async () => {
      const entries = [
        {
          id: "ug-game-1",
          userId: "user-game",
          gameId: "game-shared",
          platformId: "platform-ps5",
          storeId: null,
          platformGameId: null,
          owned: true,
          purchasedDate: null,
          importSource: null,
          createdAt: new Date(),
        },
        {
          id: "ug-game-2",
          userId: "user-game",
          gameId: "game-shared",
          platformId: "platform-pc",
          storeId: "store-steam",
          platformGameId: "steam-app-123",
          owned: true,
          purchasedDate: new Date("2024-01-01"),
          importSource: null,
          createdAt: new Date(),
        },
      ];

      const mockQuery = {
        userGames: {
          findMany: async () => entries,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.getByGameForUser("user-game", "game-shared");

      expect(result).toHaveLength(2);
      expect(result[0].game_id).toBe("game-shared");
      expect(result[0].platform_id).toBe("platform-ps5");
      expect(result[1].platform_id).toBe("platform-pc");
    });

    it("returns empty array when user does not own game", async () => {
      const mockQuery = {
        userGames: {
          findMany: async () => [],
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.getByGameForUser("user-no-game", "game-not-owned");

      expect(result).toHaveLength(0);
    });

    it("returns empty array for different user (cross-user protection)", async () => {
      const mockQuery = {
        userGames: {
          findMany: async () => [],
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.getByGameForUser("user-other", "game-shared");

      expect(result).toHaveLength(0);
    });
  });

  describe("deleteAllByUser", () => {
    it("deletes all entries for a user", async () => {
      const deletedEntries = Array.from({ length: 5 }, (_, i) => ({
        id: `ug-cleanup-${i}`,
        userId: "user-cleanup",
        gameId: `game-${i}`,
        platformId: "platform-1",
        storeId: null,
        platformGameId: null,
        owned: true,
        purchasedDate: null,
        importSource: null,
        createdAt: new Date(),
      }));

      mockDeleteResult(mockDb, deletedEntries);

      const count = await repository.deleteAllByUser("user-cleanup");

      expect(count).toBe(5);
    });

    it("returns 0 when user has no entries", async () => {
      mockDeleteResult(mockDb, []);

      const count = await repository.deleteAllByUser("user-no-entries");

      expect(count).toBe(0);
    });
  });

  describe("countByUser", () => {
    it("returns count of games for user", async () => {
      const mockSelect = {
        from: () => ({
          where: async () => [{ count: 15 }],
        }),
      };
      Object.defineProperty(mockDb, "select", {
        value: () => mockSelect,
        writable: true,
      });

      const count = await repository.countByUser("user-count");

      expect(count).toBe(15);
    });

    it("returns 0 when user has no games", async () => {
      const mockSelect = {
        from: () => ({
          where: async () => [{ count: 0 }],
        }),
      };
      Object.defineProperty(mockDb, "select", {
        value: () => mockSelect,
        writable: true,
      });

      const count = await repository.countByUser("user-no-games");

      expect(count).toBe(0);
    });

    it("handles empty result gracefully", async () => {
      const mockSelect = {
        from: () => ({
          where: async () => [],
        }),
      };
      Object.defineProperty(mockDb, "select", {
        value: () => mockSelect,
        writable: true,
      });

      const count = await repository.countByUser("user-empty-result");

      expect(count).toBe(0);
    });
  });
});
