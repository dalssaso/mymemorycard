import "reflect-metadata";
import { describe, it, expect, beforeEach, mock } from "bun:test";
import { EmbeddingService } from "@/features/ai/services/embedding.service";
import {
  createMockGatewayService,
  createMockAiSettingsRepository,
  createMockEmbeddingRepository,
} from "@/tests/helpers/repository.mocks";
import { ConfigurationError } from "@/features/ai/errors/configuration.error";
import type { IGatewayService } from "@/features/ai/services/gateway.service.interface";
import type { IAiSettingsRepository } from "@/features/ai/repositories/ai-settings.repository.interface";
import type { IEmbeddingRepository } from "@/features/ai/repositories/embedding.repository.interface";

describe("EmbeddingService", () => {
  let embeddingService: EmbeddingService;
  let mockGateway: IGatewayService;
  let mockSettingsRepo: IAiSettingsRepository;
  let mockEmbeddingRepo: IEmbeddingRepository;

  beforeEach(() => {
    mockGateway = createMockGatewayService();
    mockSettingsRepo = createMockAiSettingsRepository();
    mockEmbeddingRepo = createMockEmbeddingRepository();

    embeddingService = new EmbeddingService(mockGateway, mockEmbeddingRepo, mockSettingsRepo);
  });

  describe("generateGameEmbedding", () => {
    it("should generate and save game embedding successfully", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue({
        apiKey: "test-key",
        provider: "openai",
      });
      mockGateway.generateEmbedding = mock().mockResolvedValue({
        embedding: [0.1, 0.2, 0.3],
        model: "text-embedding-3-small",
        tokensUsed: 50,
      });

      await embeddingService.generateGameEmbedding("user-1", "game-1", "Test game description");

      expect(mockSettingsRepo.getGatewayConfig).toHaveBeenCalledWith("user-1");
      expect(mockGateway.generateEmbedding).toHaveBeenCalledWith("Test game description", {
        apiKey: "test-key",
        provider: "openai",
      });

      // Verify saveGameEmbedding was called with the correct parameters
      expect(mockEmbeddingRepo.saveGameEmbedding).toHaveBeenCalledTimes(1);
      const [gameId, embedding, model, textHash] = (
        mockEmbeddingRepo.saveGameEmbedding as ReturnType<typeof mock>
      ).mock.calls[0];
      expect(gameId).toBe("game-1");
      expect(embedding).toEqual([0.1, 0.2, 0.3]);
      expect(model).toBe("text-embedding-3-small");
      expect(typeof textHash).toBe("string");
      expect(textHash).toHaveLength(64); // SHA-256 hex string length
    });

    it("should throw ConfigurationError when AI settings not configured", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue(null);

      await expect(
        embeddingService.generateGameEmbedding("user-1", "game-1", "Test game")
      ).rejects.toThrow(ConfigurationError);

      expect(mockGateway.generateEmbedding).not.toHaveBeenCalled();
      expect(mockEmbeddingRepo.saveGameEmbedding).not.toHaveBeenCalled();
    });
  });

  describe("generateCollectionEmbedding", () => {
    it("should generate and save collection embedding successfully", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue({
        apiKey: "test-key",
        provider: "xai",
      });
      mockGateway.generateEmbedding = mock().mockResolvedValue({
        embedding: [0.4, 0.5, 0.6],
        model: "text-embedding-3-small",
        tokensUsed: 75,
      });

      await embeddingService.generateCollectionEmbedding(
        "user-1",
        "collection-1",
        "RPG Collection"
      );

      expect(mockSettingsRepo.getGatewayConfig).toHaveBeenCalledWith("user-1");
      expect(mockGateway.generateEmbedding).toHaveBeenCalledWith("RPG Collection", {
        apiKey: "test-key",
        provider: "xai",
      });

      // Verify saveCollectionEmbedding was called with the correct parameters
      expect(mockEmbeddingRepo.saveCollectionEmbedding).toHaveBeenCalledTimes(1);
      const [collectionId, embedding, model, textHash] = (
        mockEmbeddingRepo.saveCollectionEmbedding as ReturnType<typeof mock>
      ).mock.calls[0];
      expect(collectionId).toBe("collection-1");
      expect(embedding).toEqual([0.4, 0.5, 0.6]);
      expect(model).toBe("text-embedding-3-small");
      expect(typeof textHash).toBe("string");
      expect(textHash).toHaveLength(64); // SHA-256 hex string length
    });

    it("should throw ConfigurationError when AI settings not configured", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue(null);

      await expect(
        embeddingService.generateCollectionEmbedding("user-1", "collection-1", "Test collection")
      ).rejects.toThrow(ConfigurationError);

      expect(mockGateway.generateEmbedding).not.toHaveBeenCalled();
      expect(mockEmbeddingRepo.saveCollectionEmbedding).not.toHaveBeenCalled();
    });
  });

  describe("findSimilarGames", () => {
    it("should find similar games when embedding exists", async () => {
      mockEmbeddingRepo.findByGameId = mock().mockResolvedValue({
        id: "embedding-1",
        gameId: "game-1",
        embedding: [0.1, 0.2, 0.3],
        textHash: "hash123",
        model: "text-embedding-3-small",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockEmbeddingRepo.findSimilarGames = mock().mockResolvedValue(["game-2", "game-3", "game-4"]);

      const result = await embeddingService.findSimilarGames("user-1", "game-1", 3);

      expect(mockEmbeddingRepo.findByGameId).toHaveBeenCalledWith("game-1");
      expect(mockEmbeddingRepo.findSimilarGames).toHaveBeenCalledWith([0.1, 0.2, 0.3], 3, [
        "game-1",
      ]);
      expect(result).toEqual(["game-2", "game-3", "game-4"]);
    });

    it("should return empty array when embedding does not exist", async () => {
      mockEmbeddingRepo.findByGameId = mock().mockResolvedValue(null);

      const result = await embeddingService.findSimilarGames("user-1", "game-1", 3);

      expect(mockEmbeddingRepo.findByGameId).toHaveBeenCalledWith("game-1");
      expect(mockEmbeddingRepo.findSimilarGames).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("should return empty array when embedding field is null", async () => {
      mockEmbeddingRepo.findByGameId = mock().mockResolvedValue({
        id: "embedding-1",
        gameId: "game-1",
        embedding: null,
        textHash: "hash123",
        model: "text-embedding-3-small",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await embeddingService.findSimilarGames("user-1", "game-1", 3);

      expect(mockEmbeddingRepo.findByGameId).toHaveBeenCalledWith("game-1");
      expect(mockEmbeddingRepo.findSimilarGames).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("should clamp limit to maximum of 100", async () => {
      mockEmbeddingRepo.findByGameId = mock().mockResolvedValue({
        id: "embedding-1",
        gameId: "game-1",
        embedding: [0.1, 0.2, 0.3],
        textHash: "hash123",
        model: "text-embedding-3-small",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockEmbeddingRepo.findSimilarGames = mock().mockResolvedValue([]);

      await embeddingService.findSimilarGames("user-1", "game-1", 150);

      expect(mockEmbeddingRepo.findSimilarGames).toHaveBeenCalledWith([0.1, 0.2, 0.3], 100, [
        "game-1",
      ]);
    });

    it("should clamp limit to minimum of 1", async () => {
      mockEmbeddingRepo.findByGameId = mock().mockResolvedValue({
        id: "embedding-1",
        gameId: "game-1",
        embedding: [0.1, 0.2, 0.3],
        textHash: "hash123",
        model: "text-embedding-3-small",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockEmbeddingRepo.findSimilarGames = mock().mockResolvedValue([]);

      await embeddingService.findSimilarGames("user-1", "game-1", 0);

      expect(mockEmbeddingRepo.findSimilarGames).toHaveBeenCalledWith([0.1, 0.2, 0.3], 1, [
        "game-1",
      ]);
    });
  });

  describe("findSimilarCollections", () => {
    it("should find similar collections when embedding exists", async () => {
      mockEmbeddingRepo.findByCollectionId = mock().mockResolvedValue({
        id: "embedding-2",
        collectionId: "collection-1",
        embedding: [0.7, 0.8, 0.9],
        textHash: "hash456",
        model: "text-embedding-3-small",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockEmbeddingRepo.findSimilarCollections = mock().mockResolvedValue([
        "collection-2",
        "collection-3",
      ]);

      const result = await embeddingService.findSimilarCollections("user-1", "collection-1", 2);

      expect(mockEmbeddingRepo.findByCollectionId).toHaveBeenCalledWith("collection-1");
      expect(mockEmbeddingRepo.findSimilarCollections).toHaveBeenCalledWith([0.7, 0.8, 0.9], 2);
      expect(result).toEqual(["collection-2", "collection-3"]);
    });

    it("should return empty array when embedding does not exist", async () => {
      mockEmbeddingRepo.findByCollectionId = mock().mockResolvedValue(null);

      const result = await embeddingService.findSimilarCollections("user-1", "collection-1", 2);

      expect(mockEmbeddingRepo.findByCollectionId).toHaveBeenCalledWith("collection-1");
      expect(mockEmbeddingRepo.findSimilarCollections).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("should return empty array when embedding field is null", async () => {
      mockEmbeddingRepo.findByCollectionId = mock().mockResolvedValue({
        id: "embedding-2",
        collectionId: "collection-1",
        embedding: null,
        textHash: "hash456",
        model: "text-embedding-3-small",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await embeddingService.findSimilarCollections("user-1", "collection-1", 2);

      expect(mockEmbeddingRepo.findByCollectionId).toHaveBeenCalledWith("collection-1");
      expect(mockEmbeddingRepo.findSimilarCollections).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("should clamp limit to maximum of 100", async () => {
      mockEmbeddingRepo.findByCollectionId = mock().mockResolvedValue({
        id: "embedding-2",
        collectionId: "collection-1",
        embedding: [0.7, 0.8, 0.9],
        textHash: "hash456",
        model: "text-embedding-3-small",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockEmbeddingRepo.findSimilarCollections = mock().mockResolvedValue([]);

      await embeddingService.findSimilarCollections("user-1", "collection-1", 200);

      expect(mockEmbeddingRepo.findSimilarCollections).toHaveBeenCalledWith([0.7, 0.8, 0.9], 100);
    });

    it("should clamp limit to minimum of 1", async () => {
      mockEmbeddingRepo.findByCollectionId = mock().mockResolvedValue({
        id: "embedding-2",
        collectionId: "collection-1",
        embedding: [0.7, 0.8, 0.9],
        textHash: "hash456",
        model: "text-embedding-3-small",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockEmbeddingRepo.findSimilarCollections = mock().mockResolvedValue([]);

      await embeddingService.findSimilarCollections("user-1", "collection-1", -5);

      expect(mockEmbeddingRepo.findSimilarCollections).toHaveBeenCalledWith([0.7, 0.8, 0.9], 1);
    });
  });
});
