import "reflect-metadata";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { container } from "tsyringe";
import { AiController } from "@/features/ai/controllers/ai.controller";
import { ConfigurationError } from "@/features/ai/errors/configuration.error";
import { ValidationError } from "@/shared/errors/base";
import type { Logger } from "@/infrastructure/logging/logger";
import {
  createMockEmbeddingService,
  createMockCuratorService,
  createMockImageService,
  createMockTokenService,
  createMockUserRepository,
  type MockEmbeddingService,
  type MockCuratorService,
  type MockImageService,
} from "@/tests/helpers/repository.mocks";

describe("AiController", () => {
  let controller: AiController;
  let mockEmbeddingService: MockEmbeddingService;
  let mockCuratorService: MockCuratorService;
  let mockImageService: MockImageService;
  const validGameId = "550e8400-e29b-41d4-a716-446655440000";
  const testToken = "token_test-user-id";

  const createMockLogger = (): Logger => {
    const mockInstance = {
      debug: mock(() => {}),
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
      child: mock(() => mockInstance),
    };
    return mockInstance as unknown as Logger;
  };

  beforeEach(() => {
    // Register required dependencies for createAuthMiddleware
    container.register("ITokenService", { useValue: createMockTokenService() });
    container.register("IUserRepository", {
      useValue: createMockUserRepository({
        findById: async () => ({
          id: "test-user-id",
          username: "testuser",
          email: "test@example.com",
          passwordHash: "hashed",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      }),
    });

    // Create mocks with default implementations
    mockEmbeddingService = createMockEmbeddingService();
    mockCuratorService = createMockCuratorService();
    mockCuratorService.suggestCollections = mock().mockResolvedValue([
      {
        name: "Test Collection",
        description: "Test description",
        gameIds: [validGameId],
        confidence: 0.9,
      },
    ]);
    mockCuratorService.suggestNextGame = mock().mockResolvedValue([
      {
        gameId: validGameId,
        reason: "Test reason",
        confidence: 0.85,
      },
    ]);
    mockImageService = createMockImageService();

    const mockLogger = createMockLogger();
    controller = new AiController(
      mockEmbeddingService,
      mockCuratorService,
      mockImageService,
      mockLogger
    );
  });

  afterEach(() => {
    // Clean up DI container after each test
    container.clearInstances();
  });

  describe("Controller instantiation", () => {
    it("should instantiate controller with dependencies", () => {
      expect(controller).toBeDefined();
      expect(controller.router).toBeDefined();
    });
  });

  describe("Route registration", () => {
    it("should register all expected routes", () => {
      // Verify the router has routes registered
      // Hono routers don't expose routes directly, but we can verify by making requests
      expect(controller.router).toBeDefined();
    });
  });

  describe("POST /embeddings/games", () => {
    it("should generate game embedding successfully", async () => {
      const response = await controller.router.request("/embeddings/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          gameId: validGameId,
          text: "An epic RPG adventure",
        }),
      });

      expect(response.status).toBe(201);
      const data = (await response.json()) as { success: boolean };
      expect(data.success).toBe(true);
      expect(mockEmbeddingService.generateGameEmbedding).toHaveBeenCalledTimes(1);
      expect(mockEmbeddingService.generateGameEmbedding).toHaveBeenCalledWith(
        "test-user-id",
        validGameId,
        "An epic RPG adventure"
      );
    });

    it("should return 401 when no auth token provided", async () => {
      const response = await controller.router.request("/embeddings/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId: validGameId,
          text: "Test text",
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid UUID", async () => {
      const response = await controller.router.request("/embeddings/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          gameId: "invalid-uuid",
          text: "Test text",
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for missing text", async () => {
      const response = await controller.router.request("/embeddings/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          gameId: validGameId,
          text: "",
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 500 when service throws error", async () => {
      mockEmbeddingService.generateGameEmbedding.mockRejectedValueOnce(
        new Error("AI service error")
      );

      const response = await controller.router.request("/embeddings/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          gameId: validGameId,
          text: "Test text",
        }),
      });

      expect(response.status).toBe(500);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe("AI service error");
    });

    it("should return 503 when service throws ConfigurationError", async () => {
      mockEmbeddingService.generateGameEmbedding.mockRejectedValueOnce(
        new ConfigurationError("AI provider not configured")
      );

      const response = await controller.router.request("/embeddings/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          gameId: validGameId,
          text: "Test text",
        }),
      });

      expect(response.status).toBe(503);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe("AI provider not configured");
    });

    it("should return 400 when service throws ValidationError", async () => {
      mockEmbeddingService.generateGameEmbedding.mockRejectedValueOnce(
        new ValidationError("Invalid embedding parameters")
      );

      const response = await controller.router.request("/embeddings/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          gameId: validGameId,
          text: "Test text",
        }),
      });

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe("Invalid embedding parameters");
    });
  });

  describe("POST /embeddings/collections", () => {
    it("should generate collection embedding successfully", async () => {
      const response = await controller.router.request("/embeddings/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          collectionId: validGameId,
          text: "My favorite RPGs",
        }),
      });

      expect(response.status).toBe(201);
      const data = (await response.json()) as { success: boolean };
      expect(data.success).toBe(true);
      expect(mockEmbeddingService.generateCollectionEmbedding).toHaveBeenCalledTimes(1);
      expect(mockEmbeddingService.generateCollectionEmbedding).toHaveBeenCalledWith(
        "test-user-id",
        validGameId,
        "My favorite RPGs"
      );
    });

    it("should return 401 when no auth token provided", async () => {
      const response = await controller.router.request("/embeddings/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectionId: validGameId,
          text: "Test text",
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid request body", async () => {
      const response = await controller.router.request("/embeddings/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          collectionId: "not-a-uuid",
          text: "",
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 500 when service throws error", async () => {
      mockEmbeddingService.generateCollectionEmbedding.mockRejectedValueOnce(
        new Error("Database error")
      );

      const response = await controller.router.request("/embeddings/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          collectionId: validGameId,
          text: "Test collection",
        }),
      });

      expect(response.status).toBe(500);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe("Database error");
    });
  });

  describe("POST /suggestions/collections", () => {
    it("should suggest collections successfully", async () => {
      const gameIds = [validGameId, "550e8400-e29b-41d4-a716-446655440001"];

      const response = await controller.router.request("/suggestions/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          gameIds,
        }),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as Array<{
        name: string;
        description: string;
        gameIds: string[];
        confidence: number;
      }>;
      expect(data).toHaveLength(1);
      expect(data[0]).toHaveProperty("name");
      expect(data[0]).toHaveProperty("description");
      expect(data[0]).toHaveProperty("gameIds");
      expect(data[0]).toHaveProperty("confidence");
      expect(mockCuratorService.suggestCollections).toHaveBeenCalledTimes(1);
      expect(mockCuratorService.suggestCollections).toHaveBeenCalledWith("test-user-id", gameIds);
    });

    it("should return 401 when no auth token provided", async () => {
      const response = await controller.router.request("/suggestions/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameIds: [validGameId],
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 400 for empty gameIds array", async () => {
      const response = await controller.router.request("/suggestions/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          gameIds: [],
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for gameIds array exceeding max length", async () => {
      const tooManyGameIds = Array.from({ length: 101 }, (_, i) =>
        `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, "0")}`.slice(0, 36)
      );

      const response = await controller.router.request("/suggestions/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          gameIds: tooManyGameIds,
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid UUID in gameIds", async () => {
      const response = await controller.router.request("/suggestions/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          gameIds: ["invalid-uuid"],
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 500 when service throws error", async () => {
      mockCuratorService.suggestCollections.mockRejectedValueOnce(new Error("AI error"));

      const response = await controller.router.request("/suggestions/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          gameIds: [validGameId],
        }),
      });

      expect(response.status).toBe(500);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe("AI error");
    });
  });

  describe("POST /suggestions/next-game", () => {
    it("should suggest next game successfully", async () => {
      const recentGameIds = [validGameId, "550e8400-e29b-41d4-a716-446655440001"];

      const response = await controller.router.request("/suggestions/next-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          recentGameIds,
        }),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as Array<{
        gameId: string;
        reason: string;
        confidence: number;
      }>;
      expect(data).toHaveLength(1);
      expect(data[0]).toHaveProperty("gameId");
      expect(data[0]).toHaveProperty("reason");
      expect(data[0]).toHaveProperty("confidence");
      expect(mockCuratorService.suggestNextGame).toHaveBeenCalledTimes(1);
      expect(mockCuratorService.suggestNextGame).toHaveBeenCalledWith(
        "test-user-id",
        recentGameIds
      );
    });

    it("should return 401 when no auth token provided", async () => {
      const response = await controller.router.request("/suggestions/next-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recentGameIds: [validGameId],
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 400 for empty recentGameIds array", async () => {
      const response = await controller.router.request("/suggestions/next-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          recentGameIds: [],
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for recentGameIds array exceeding max length", async () => {
      const tooManyGameIds = Array.from({ length: 21 }, (_, i) =>
        `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, "0")}`.slice(0, 36)
      );

      const response = await controller.router.request("/suggestions/next-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          recentGameIds: tooManyGameIds,
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid UUID in recentGameIds", async () => {
      const response = await controller.router.request("/suggestions/next-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          recentGameIds: ["not-a-valid-uuid"],
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 500 when service throws error", async () => {
      mockCuratorService.suggestNextGame.mockRejectedValueOnce(new Error("Suggestion failed"));

      const response = await controller.router.request("/suggestions/next-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          recentGameIds: [validGameId],
        }),
      });

      expect(response.status).toBe(500);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe("Suggestion failed");
    });
  });

  describe("POST /images/collection-cover", () => {
    it("should generate collection cover successfully", async () => {
      const response = await controller.router.request("/images/collection-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          collectionName: "My RPG Collection",
          gameNames: ["The Witcher 3", "Dark Souls", "Elden Ring"],
        }),
      });

      expect(response.status).toBe(201);
      const data = (await response.json()) as { url: string; model: string };
      expect(data.url).toBeDefined();
      expect(data.model).toBeDefined();
      expect(mockImageService.generateCollectionCover).toHaveBeenCalledTimes(1);
      expect(mockImageService.generateCollectionCover).toHaveBeenCalledWith(
        "test-user-id",
        "My RPG Collection",
        ["The Witcher 3", "Dark Souls", "Elden Ring"]
      );
    });

    it("should return 401 when no auth token provided", async () => {
      const response = await controller.router.request("/images/collection-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collectionName: "Test",
          gameNames: ["Game 1"],
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 400 for empty collection name", async () => {
      const response = await controller.router.request("/images/collection-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          collectionName: "",
          gameNames: ["Game 1"],
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for empty gameNames array", async () => {
      const response = await controller.router.request("/images/collection-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          collectionName: "Test Collection",
          gameNames: [],
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for gameNames array exceeding max length", async () => {
      const tooManyGames = Array.from({ length: 11 }, (_, i) => `Game ${i + 1}`);

      const response = await controller.router.request("/images/collection-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          collectionName: "Test Collection",
          gameNames: tooManyGames,
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for empty string in gameNames", async () => {
      const response = await controller.router.request("/images/collection-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          collectionName: "Test Collection",
          gameNames: ["Game 1", ""],
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 500 when service throws error", async () => {
      mockImageService.generateCollectionCover.mockRejectedValueOnce(
        new Error("Image generation failed")
      );

      const response = await controller.router.request("/images/collection-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify({
          collectionName: "Test Collection",
          gameNames: ["Game 1"],
        }),
      });

      expect(response.status).toBe(500);
      const data = (await response.json()) as { error: string };
      expect(data.error).toBe("Image generation failed");
    });
  });
});
