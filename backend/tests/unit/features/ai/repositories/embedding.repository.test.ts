import "reflect-metadata";
import { describe, it, expect, beforeEach, mock } from "bun:test";
import { EmbeddingRepository } from "@/features/ai/repositories/embedding.repository";
import { createMockDrizzleDB } from "@/tests/helpers/drizzle.mocks";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import type { GameEmbedding, CollectionEmbedding } from "@/features/ai/types";
import { EMBEDDING_DIMENSIONS } from "@/features/ai/types";

// Helper function to create a valid mock embedding with correct dimensions
function createMockEmbedding(): number[] {
  return new Array(EMBEDDING_DIMENSIONS).fill(0).map(() => Math.random());
}

// Helper function to create a mock select chain for similarity queries
function createMockSelectChain(
  mockDb: DrizzleDB,
  resultArray: Array<{ gameId?: string; collectionId?: string }>
): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>;

  if (resultArray.length === 0) {
    // Simple case: no where clause, just resolve with empty array
    selectMock.mockReturnValue({
      from: mock().mockReturnValue({
        orderBy: mock().mockReturnValue({
          limit: mock().mockResolvedValue([]),
        }),
      }),
    });
  } else {
    // With results: create a limit result that has an optional where() method
    const mockLimitResult = {
      where: mock(() => Promise.resolve(resultArray)),
    };

    // Make the limit result itself a thenable (for queries without where)
    Object.assign(mockLimitResult, {
      then: (resolve: (value: unknown) => void) => {
        resolve(resultArray);
        return Promise.resolve(resultArray);
      },
    });

    selectMock.mockReturnValue({
      from: mock().mockReturnValue({
        orderBy: mock().mockReturnValue({
          limit: mock().mockReturnValue(mockLimitResult),
        }),
      }),
    });
  }
}

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
        embedding: createMockEmbedding(),
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
        embedding: createMockEmbedding(),
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
      const valuesMock = mock().mockReturnValue({
        onConflictDoUpdate: mock().mockResolvedValue(undefined),
      });
      const insertMock = mockDb.insert as ReturnType<typeof mock>;
      insertMock.mockReturnValue({
        values: valuesMock,
      });

      const testEmbedding = createMockEmbedding();

      await repository.saveGameEmbedding(
        "game-789",
        testEmbedding,
        "text-embedding-3-small",
        "test-hash-123"
      );

      expect(mockDb.insert).toHaveBeenCalledTimes(1);
      expect(valuesMock).toHaveBeenCalledTimes(1);

      const payload = valuesMock.mock.calls[0][0];
      expect(payload).toMatchObject({
        gameId: "game-789",
        embedding: testEmbedding,
        model: "text-embedding-3-small",
        textHash: "test-hash-123",
      });
    });
  });

  describe("saveCollectionEmbedding", () => {
    it("should save collection embedding successfully", async () => {
      const valuesMock = mock().mockReturnValue({
        onConflictDoUpdate: mock().mockResolvedValue(undefined),
      });
      const insertMock = mockDb.insert as ReturnType<typeof mock>;
      insertMock.mockReturnValue({
        values: valuesMock,
      });

      const testEmbedding = createMockEmbedding();

      await repository.saveCollectionEmbedding(
        "collection-999",
        testEmbedding,
        "text-embedding-3-small",
        "test-hash-456"
      );

      expect(mockDb.insert).toHaveBeenCalledTimes(1);
      expect(valuesMock).toHaveBeenCalledTimes(1);

      const payload = valuesMock.mock.calls[0][0];
      expect(payload).toMatchObject({
        collectionId: "collection-999",
        embedding: testEmbedding,
        model: "text-embedding-3-small",
        textHash: "test-hash-456",
      });
    });
  });

  describe("findSimilarGames", () => {
    it("should find similar games without exclusions", async () => {
      createMockSelectChain(mockDb, [
        { gameId: "game-1" },
        { gameId: "game-2" },
        { gameId: "game-3" },
      ]);

      const result = await repository.findSimilarGames(createMockEmbedding(), 3);

      expect(result).toEqual(["game-1", "game-2", "game-3"]);
    });

    it("should find similar games with exclusions", async () => {
      createMockSelectChain(mockDb, [{ gameId: "game-2" }, { gameId: "game-3" }]);

      const result = await repository.findSimilarGames(createMockEmbedding(), 2, ["game-1"]);

      expect(result).toEqual(["game-2", "game-3"]);
    });

    it("should return empty array when no similar games found", async () => {
      createMockSelectChain(mockDb, []);

      const result = await repository.findSimilarGames(createMockEmbedding(), 3);

      expect(result).toEqual([]);
    });
  });

  describe("findSimilarCollections", () => {
    it("should find similar collections", async () => {
      createMockSelectChain(mockDb, [
        { collectionId: "collection-1" },
        { collectionId: "collection-2" },
      ]);

      const result = await repository.findSimilarCollections(createMockEmbedding(), 2);

      expect(result).toEqual(["collection-1", "collection-2"]);
    });

    it("should find similar collections with exclusions", async () => {
      createMockSelectChain(mockDb, [
        { collectionId: "collection-1" },
        { collectionId: "collection-2" },
      ]);

      const result = await repository.findSimilarCollections(createMockEmbedding(), 2, [
        "collection-1",
      ]);

      expect(result).toEqual(["collection-2"]);
    });

    it("should return empty array when no similar collections found", async () => {
      createMockSelectChain(mockDb, []);

      const result = await repository.findSimilarCollections(createMockEmbedding(), 2);

      expect(result).toEqual([]);
    });
  });

  describe("embedding validation", () => {
    it("should reject embedding with wrong dimensions in findSimilarGames", () => {
      const invalidEmbedding = [0.1, 0.2, 0.3]; // Only 3 dimensions instead of 1536

      expect(() => repository.findSimilarGames(invalidEmbedding, 5)).toThrow(
        `Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got 3`
      );
    });

    it("should reject embedding with NaN values in findSimilarGames", () => {
      const invalidEmbedding = createMockEmbedding();
      invalidEmbedding[0] = NaN;

      expect(() => repository.findSimilarGames(invalidEmbedding, 5)).toThrow(
        "Embedding contains non-finite values (NaN or Infinity)"
      );
    });

    it("should reject embedding with Infinity values in findSimilarGames", () => {
      const invalidEmbedding = createMockEmbedding();
      invalidEmbedding[100] = Infinity;

      expect(() => repository.findSimilarGames(invalidEmbedding, 5)).toThrow(
        "Embedding contains non-finite values (NaN or Infinity)"
      );
    });

    it("should reject embedding with wrong dimensions in findSimilarCollections", () => {
      const invalidEmbedding = [0.4, 0.5]; // Only 2 dimensions instead of 1536

      expect(() => repository.findSimilarCollections(invalidEmbedding, 3)).toThrow(
        `Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got 2`
      );
    });

    it("should reject embedding with NaN values in findSimilarCollections", () => {
      const invalidEmbedding = createMockEmbedding();
      invalidEmbedding[500] = NaN;

      expect(() => repository.findSimilarCollections(invalidEmbedding, 3)).toThrow(
        "Embedding contains non-finite values (NaN or Infinity)"
      );
    });

    it("should reject embedding with Infinity values in findSimilarCollections", () => {
      const invalidEmbedding = createMockEmbedding();
      invalidEmbedding[1000] = -Infinity;

      expect(() => repository.findSimilarCollections(invalidEmbedding, 3)).toThrow(
        "Embedding contains non-finite values (NaN or Infinity)"
      );
    });
  });
});
