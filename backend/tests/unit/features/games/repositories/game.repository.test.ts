import { beforeEach, describe, expect, it } from "bun:test";
import "reflect-metadata";

import { GameRepository } from "@/features/games/repositories/game.repository";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import { ConflictError, NotFoundError } from "@/shared/errors/base";
import {
  createMockDrizzleDB,
  mockDeleteResult,
  mockInsertError,
  mockInsertResult,
  mockUpdateResult,
} from "@/tests/helpers/drizzle.mocks";

describe("GameRepository", () => {
  let repository: GameRepository;
  let mockDb: DrizzleDB;

  beforeEach(() => {
    mockDb = createMockDrizzleDB();
    repository = new GameRepository(mockDb);
  });

  describe("findById", () => {
    it("returns null when game not found", async () => {
      const mockQuery = {
        games: {
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

    it("returns game when found by id", async () => {
      const gameRow = {
        id: "game-123",
        igdbId: 1000,
        rawgId: 5000,
        name: "The Witcher 3",
        slug: "the-witcher-3",
        releaseDate: "2015-05-19",
        description: "Epic RPG",
        coverArtUrl: "https://example.com/cover.jpg",
        backgroundImageUrl: "https://example.com/bg.jpg",
        metacriticScore: 92,
        opencriticScore: 91,
        esrbRating: "M",
        seriesName: "The Witcher",
        expectedPlaytime: 100,
        metadataSource: "igdb" as const,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const mockQuery = {
        games: {
          findFirst: async () => gameRow,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findById("game-123");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("game-123");
      expect(result?.name).toBe("The Witcher 3");
      expect(result?.igdb_id).toBe(1000);
    });
  });

  describe("findByIgdbId", () => {
    it("returns null when game not found by igdb_id", async () => {
      const mockQuery = {
        games: {
          findFirst: async () => null,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findByIgdbId(9999);

      expect(result).toBeNull();
    });

    it("returns game when found by igdb_id", async () => {
      const gameRow = {
        id: "game-456",
        igdbId: 7500,
        rawgId: null,
        name: "Elden Ring",
        slug: "elden-ring",
        releaseDate: "2022-02-25",
        description: "Action RPG",
        coverArtUrl: null,
        backgroundImageUrl: null,
        metacriticScore: 96,
        opencriticScore: null,
        esrbRating: "M",
        seriesName: null,
        expectedPlaytime: 60,
        metadataSource: "igdb" as const,
        createdAt: new Date("2024-01-02"),
        updatedAt: new Date("2024-01-02"),
      };

      const mockQuery = {
        games: {
          findFirst: async () => gameRow,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findByIgdbId(7500);

      expect(result).not.toBeNull();
      expect(result?.igdb_id).toBe(7500);
      expect(result?.name).toBe("Elden Ring");
    });
  });

  describe("findByRawgId", () => {
    it("returns null when game not found by rawg_id", async () => {
      const mockQuery = {
        games: {
          findFirst: async () => null,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findByRawgId(9999);

      expect(result).toBeNull();
    });

    it("returns game when found by rawg_id", async () => {
      const gameRow = {
        id: "game-789",
        igdbId: null,
        rawgId: 3328,
        name: "The Legend of Zelda",
        slug: "zelda",
        releaseDate: "1986-02-21",
        description: "Classic adventure",
        coverArtUrl: null,
        backgroundImageUrl: null,
        metacriticScore: 98,
        opencriticScore: null,
        esrbRating: "E10+",
        seriesName: "The Legend of Zelda",
        expectedPlaytime: 40,
        metadataSource: "rawg" as const,
        createdAt: new Date("2024-01-03"),
        updatedAt: new Date("2024-01-03"),
      };

      const mockQuery = {
        games: {
          findFirst: async () => gameRow,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findByRawgId(3328);

      expect(result).not.toBeNull();
      expect(result?.rawg_id).toBe(3328);
      expect(result?.name).toBe("The Legend of Zelda");
    });
  });

  describe("create", () => {
    it("creates a new game with minimal data", async () => {
      const newGame = {
        id: "game-new-1",
        igdbId: 1001,
        rawgId: null,
        name: "New Game",
        slug: "new-game",
        releaseDate: null,
        description: null,
        coverArtUrl: null,
        backgroundImageUrl: null,
        metacriticScore: null,
        opencriticScore: null,
        esrbRating: null,
        seriesName: null,
        expectedPlaytime: null,
        metadataSource: "manual" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInsertResult(mockDb, [newGame]);

      const result = await repository.create({
        name: "New Game",
        metadata_source: "manual",
      });

      expect(result.name).toBe("New Game");
      expect(result.metadata_source).toBe("manual");
    });

    it("creates a game with full metadata", async () => {
      const fullGame = {
        id: "game-full-1",
        igdbId: 2000,
        rawgId: 6000,
        name: "Full Game",
        slug: "full-game",
        releaseDate: "2024-01-01",
        description: "Full description",
        coverArtUrl: "https://example.com/cover.jpg",
        backgroundImageUrl: "https://example.com/bg.jpg",
        metacriticScore: 85,
        opencriticScore: 80,
        esrbRating: "T",
        seriesName: "Series Name",
        expectedPlaytime: 50,
        metadataSource: "igdb" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInsertResult(mockDb, [fullGame]);

      const result = await repository.create({
        name: "Full Game",
        igdb_id: 2000,
        rawg_id: 6000,
        slug: "full-game",
        release_date: new Date("2024-01-01"),
        description: "Full description",
        cover_art_url: "https://example.com/cover.jpg",
        background_image_url: "https://example.com/bg.jpg",
        metacritic_score: 85,
        opencritic_score: 80,
        esrb_rating: "T",
        series_name: "Series Name",
        expected_playtime: 50,
        metadata_source: "igdb",
      });

      expect(result.name).toBe("Full Game");
      expect(result.igdb_id).toBe(2000);
      expect(result.rawg_id).toBe(6000);
    });

    it("throws ConflictError when igdb_id already exists", async () => {
      const error = new Error("duplicate key") as unknown as Record<string, unknown>;
      error.code = "23505";
      mockInsertError(mockDb, error as unknown as Error);

      expect(
        repository.create({
          name: "Duplicate",
          igdb_id: 9999,
          metadata_source: "igdb",
        })
      ).rejects.toThrow(ConflictError);
    });

    it("throws ConflictError when unique constraint violated in nested error", async () => {
      const causedError = new Error("constraint") as unknown as Record<string, unknown>;
      causedError.code = "23505";
      const error = new Error("database error") as unknown as Record<string, unknown>;
      error.cause = causedError;
      mockInsertError(mockDb, error as unknown as Error);

      expect(
        repository.create({
          name: "Duplicate",
          igdb_id: 9999,
          metadata_source: "igdb",
        })
      ).rejects.toThrow(ConflictError);
    });

    it("throws non-conflict database errors", async () => {
      const error = new Error("connection failed") as unknown as Record<string, unknown>;
      error.code = "ECONNREFUSED";
      mockInsertError(mockDb, error as unknown as Error);

      expect(
        repository.create({
          name: "Test",
          metadata_source: "manual",
        })
      ).rejects.toThrow("connection failed");
    });
  });

  describe("update", () => {
    it("updates an existing game", async () => {
      const existingGame = {
        id: "game-update-1",
        igdbId: 3000,
        rawgId: null,
        name: "Old Name",
        slug: "old-name",
        releaseDate: "2020-01-01",
        description: "Old description",
        coverArtUrl: null,
        backgroundImageUrl: null,
        metacriticScore: 70,
        opencriticScore: null,
        esrbRating: null,
        seriesName: null,
        expectedPlaytime: null,
        metadataSource: "manual" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedGame = {
        ...existingGame,
        name: "New Name",
        description: "New description",
        metacriticScore: 75,
      };

      const mockQuery = {
        games: {
          findFirst: async () => existingGame,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });
      mockUpdateResult(mockDb, [updatedGame]);

      const result = await repository.update("game-update-1", {
        name: "New Name",
        description: "New description",
        metacritic_score: 75,
      });

      expect(result.name).toBe("New Name");
      expect(result.description).toBe("New description");
      expect(result.metacritic_score).toBe(75);
    });

    it("throws NotFoundError when game does not exist", async () => {
      const mockQuery = {
        games: {
          findFirst: async () => null,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      expect(repository.update("non-existent", { name: "New Name" })).rejects.toThrow(
        NotFoundError
      );
    });

    it("updates partial game data", async () => {
      const existingGame = {
        id: "game-partial-1",
        igdbId: 4000,
        rawgId: null,
        name: "Game",
        slug: "game",
        releaseDate: null,
        description: null,
        coverArtUrl: null,
        backgroundImageUrl: null,
        metacriticScore: null,
        opencriticScore: null,
        esrbRating: null,
        seriesName: null,
        expectedPlaytime: null,
        metadataSource: "manual" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedGame = {
        ...existingGame,
        metacriticScore: 80,
        esrbRating: "M",
      };

      const mockQuery = {
        games: {
          findFirst: async () => existingGame,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });
      mockUpdateResult(mockDb, [updatedGame]);

      const result = await repository.update("game-partial-1", {
        metacritic_score: 80,
        esrb_rating: "M",
      });

      expect(result.metacritic_score).toBe(80);
      expect(result.esrb_rating).toBe("M");
    });
  });

  describe("delete", () => {
    it("successfully deletes a game", async () => {
      const deletedGame = {
        id: "game-delete-1",
        igdbId: 5000,
        rawgId: null,
        name: "To Delete",
        slug: "to-delete",
        releaseDate: null,
        description: null,
        coverArtUrl: null,
        backgroundImageUrl: null,
        metacriticScore: null,
        opencriticScore: null,
        esrbRating: null,
        seriesName: null,
        expectedPlaytime: null,
        metadataSource: "manual" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDeleteResult(mockDb, [deletedGame]);

      const result = await repository.delete("game-delete-1");

      expect(result).toBe(true);
    });

    it("returns false when game not found for deletion", async () => {
      mockDeleteResult(mockDb, []);

      const result = await repository.delete("non-existent");

      expect(result).toBe(false);
    });
  });

  describe("search", () => {
    it("searches for games by name query", async () => {
      const results = [
        {
          id: "search-1",
          igdbId: 6000,
          rawgId: null,
          name: "The Witcher",
          slug: "the-witcher",
          releaseDate: null,
          description: null,
          coverArtUrl: null,
          backgroundImageUrl: null,
          metacriticScore: null,
          opencriticScore: null,
          esrbRating: null,
          seriesName: null,
          expectedPlaytime: null,
          metadataSource: "manual" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "search-2",
          igdbId: 7000,
          rawgId: null,
          name: "The Witcher 2",
          slug: "the-witcher-2",
          releaseDate: null,
          description: null,
          coverArtUrl: null,
          backgroundImageUrl: null,
          metacriticScore: null,
          opencriticScore: null,
          esrbRating: null,
          seriesName: null,
          expectedPlaytime: null,
          metadataSource: "manual" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockQuery = {
        games: {
          findMany: async () => results,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const searchResults = await repository.search("witcher");

      expect(searchResults).toHaveLength(2);
      expect(searchResults[0].name).toBe("The Witcher");
      expect(searchResults[1].name).toBe("The Witcher 2");
    });

    it("returns empty array when search has no matches", async () => {
      const mockQuery = {
        games: {
          findMany: async () => [],
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const searchResults = await repository.search("nonexistent game");

      expect(searchResults).toHaveLength(0);
    });

    it("respects limit parameter in search", async () => {
      const results = Array.from({ length: 10 }, (_, i) => ({
        id: `search-${i}`,
        igdbId: 8000 + i,
        rawgId: null,
        name: `Game ${i}`,
        slug: `game-${i}`,
        releaseDate: null,
        description: null,
        coverArtUrl: null,
        backgroundImageUrl: null,
        metacriticScore: null,
        opencriticScore: null,
        esrbRating: null,
        seriesName: null,
        expectedPlaytime: null,
        metadataSource: "manual" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const mockQuery = {
        games: {
          findMany: async () => results.slice(0, 5),
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const searchResults = await repository.search("game", 5);

      expect(searchResults.length).toBeLessThanOrEqual(5);
    });
  });

  describe("list", () => {
    it("lists games with default pagination", async () => {
      const games = [
        {
          id: "list-1",
          igdbId: 9000,
          rawgId: null,
          name: "Game 1",
          slug: "game-1",
          releaseDate: null,
          description: null,
          coverArtUrl: null,
          backgroundImageUrl: null,
          metacriticScore: null,
          opencriticScore: null,
          esrbRating: null,
          seriesName: null,
          expectedPlaytime: null,
          metadataSource: "manual" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockQuery = {
        games: {
          findMany: async () => games,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.list();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Game 1");
    });

    it("lists games with custom pagination", async () => {
      const games = Array.from({ length: 25 }, (_, i) => ({
        id: `list-${i}`,
        igdbId: 10000 + i,
        rawgId: null,
        name: `Game ${i}`,
        slug: `game-${i}`,
        releaseDate: null,
        description: null,
        coverArtUrl: null,
        backgroundImageUrl: null,
        metacriticScore: null,
        opencriticScore: null,
        esrbRating: null,
        seriesName: null,
        expectedPlaytime: null,
        metadataSource: "manual" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const mockQuery = {
        games: {
          findMany: async () => games.slice(10, 20),
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.list(10, 10);

      expect(result.length).toBeLessThanOrEqual(10);
    });

    it("returns empty array when no games exist", async () => {
      const mockQuery = {
        games: {
          findMany: async () => [],
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.list();

      expect(result).toHaveLength(0);
    });
  });

  describe("count", () => {
    it("returns total game count", async () => {
      const mockSelect = {
        from: async () => [{ count: 42 }],
      };
      Object.defineProperty(mockDb, "select", {
        value: () => mockSelect,
        writable: true,
      });

      const count = await repository.count();

      expect(count).toBe(42);
    });

    it("returns zero when no games exist", async () => {
      const mockSelect = {
        from: async () => [{ count: 0 }],
      };
      Object.defineProperty(mockDb, "select", {
        value: () => mockSelect,
        writable: true,
      });

      const count = await repository.count();

      expect(count).toBe(0);
    });

    it("handles null count result gracefully", async () => {
      const mockSelect = {
        from: async () => [],
      };
      Object.defineProperty(mockDb, "select", {
        value: () => mockSelect,
        writable: true,
      });

      const count = await repository.count();

      expect(count).toBe(0);
    });
  });
});
