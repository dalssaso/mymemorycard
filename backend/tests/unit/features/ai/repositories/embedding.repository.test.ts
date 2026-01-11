import "reflect-metadata";
import { describe, it, expect, beforeEach, mock } from "bun:test";
import { EmbeddingRepository } from "@/features/ai/repositories/embedding.repository";
import { createMockDrizzleDB } from "@/tests/helpers/drizzle.mocks";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import type { GameEmbedding, CollectionEmbedding } from "@/features/ai/types";

describe("EmbeddingRepository", () => {
  let repository: EmbeddingRepository;
  let mockDb: DrizzleDB;

  beforeEach(() => {
    mockDb = createMockDrizzleDB();
    repository = new EmbeddingRepository(mockDb);
  });

  describe("findByGameId", () => {
    it("should return game embedding if found", async () => {
      const mockEmbedding: GameEmbedding = {
        id: "embedding-1",
        gameId: "game-123",
        embedding: [0.1, 0.2, 0.3],
        textHash: "hash123",
        model: "text-embedding-3-small",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      };

      const selectMock = mockDb.select as ReturnType<typeof mock>;
      selectMock.mockReturnValue({
        from: mock().mockReturnValue({
          where: mock().mockReturnValue({
            limit: mock().mockResolvedValue([mockEmbedding]),
          }),
        }),
      });

      const result = await repository.findByGameId("game-123");

      expect(result).toEqual(mockEmbedding);
    });

    it("should return null if game embedding not found", async () => {
      const selectMock = mockDb.select as ReturnType<typeof mock>;
      selectMock.mockReturnValue({
        from: mock().mockReturnValue({
          where: mock().mockReturnValue({
            limit: mock().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.findByGameId("nonexistent-game");

      expect(result).toBeNull();
    });
  });

  describe("findByCollectionId", () => {
    it("should return collection embedding if found", async () => {
      const mockEmbedding: CollectionEmbedding = {
        id: "embedding-2",
        collectionId: "collection-456",
        embedding: [0.4, 0.5, 0.6],
        textHash: "hash456",
        model: "text-embedding-3-small",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      };

      const selectMock = mockDb.select as ReturnType<typeof mock>;
      selectMock.mockReturnValue({
        from: mock().mockReturnValue({
          where: mock().mockReturnValue({
            limit: mock().mockResolvedValue([mockEmbedding]),
          }),
        }),
      });

      const result = await repository.findByCollectionId("collection-456");

      expect(result).toEqual(mockEmbedding);
    });

    it("should return null if collection embedding not found", async () => {
      const selectMock = mockDb.select as ReturnType<typeof mock>;
      selectMock.mockReturnValue({
        from: mock().mockReturnValue({
          where: mock().mockReturnValue({
            limit: mock().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.findByCollectionId("nonexistent-collection");

      expect(result).toBeNull();
    });
  });

  describe("saveGameEmbedding", () => {
    it("should save game embedding successfully", async () => {
      const insertMock = mockDb.insert as ReturnType<typeof mock>;
      insertMock.mockReturnValue({
        values: mock().mockReturnValue({
          onConflictDoUpdate: mock().mockResolvedValue(undefined),
        }),
      });

      await repository.saveGameEmbedding("game-789", [0.7, 0.8, 0.9], "text-embedding-3-small");

      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("saveCollectionEmbedding", () => {
    it("should save collection embedding successfully", async () => {
      const insertMock = mockDb.insert as ReturnType<typeof mock>;
      insertMock.mockReturnValue({
        values: mock().mockReturnValue({
          onConflictDoUpdate: mock().mockResolvedValue(undefined),
        }),
      });

      await repository.saveCollectionEmbedding(
        "collection-999",
        [0.11, 0.22, 0.33],
        "text-embedding-3-small"
      );

      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("findSimilarGames", () => {
    it("should find similar games without exclusions", async () => {
      const selectMock = mockDb.select as ReturnType<typeof mock>;
      selectMock.mockReturnValue({
        from: mock().mockReturnValue({
          orderBy: mock().mockReturnValue({
            limit: mock().mockResolvedValue([
              { gameId: "game-1" },
              { gameId: "game-2" },
              { gameId: "game-3" },
            ]),
          }),
        }),
      });

      const result = await repository.findSimilarGames([0.1, 0.2, 0.3], 3);

      expect(result).toEqual(["game-1", "game-2", "game-3"]);
    });

    it("should find similar games with exclusions", async () => {
      const selectMock = mockDb.select as ReturnType<typeof mock>;

      // Create a promise-like object that resolves to the result
      const resultArray = [{ gameId: "game-2" }, { gameId: "game-3" }];

      // Mock the limit() result that has a where() method
      const mockLimitResult = {
        where: mock(() => Promise.resolve(resultArray)),
      };

      selectMock.mockReturnValue({
        from: mock().mockReturnValue({
          orderBy: mock().mockReturnValue({
            limit: mock().mockReturnValue(mockLimitResult),
          }),
        }),
      });

      const result = await repository.findSimilarGames([0.1, 0.2, 0.3], 2, ["game-1"]);

      expect(result).toEqual(["game-2", "game-3"]);
    });

    it("should return empty array when no similar games found", async () => {
      const selectMock = mockDb.select as ReturnType<typeof mock>;
      selectMock.mockReturnValue({
        from: mock().mockReturnValue({
          orderBy: mock().mockReturnValue({
            limit: mock().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.findSimilarGames([0.1, 0.2, 0.3], 3);

      expect(result).toEqual([]);
    });
  });

  describe("findSimilarCollections", () => {
    it("should find similar collections", async () => {
      const selectMock = mockDb.select as ReturnType<typeof mock>;
      selectMock.mockReturnValue({
        from: mock().mockReturnValue({
          orderBy: mock().mockReturnValue({
            limit: mock().mockResolvedValue([
              { collectionId: "collection-1" },
              { collectionId: "collection-2" },
            ]),
          }),
        }),
      });

      const result = await repository.findSimilarCollections([0.4, 0.5, 0.6], 2);

      expect(result).toEqual(["collection-1", "collection-2"]);
    });

    it("should return empty array when no similar collections found", async () => {
      const selectMock = mockDb.select as ReturnType<typeof mock>;
      selectMock.mockReturnValue({
        from: mock().mockReturnValue({
          orderBy: mock().mockReturnValue({
            limit: mock().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.findSimilarCollections([0.4, 0.5, 0.6], 2);

      expect(result).toEqual([]);
    });
  });
});
