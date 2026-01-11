import "reflect-metadata";
import { describe, it, expect, beforeEach, mock } from "bun:test";
import { CuratorService } from "@/features/ai/services/curator.service";
import {
  createMockGatewayService,
  createMockAiSettingsRepository,
} from "@/tests/helpers/repository.mocks";
import { ConfigurationError } from "@/features/ai/errors/configuration.error";
import type { IGatewayService } from "@/features/ai/services/gateway.service.interface";
import type { IAiSettingsRepository } from "@/features/ai/repositories/ai-settings.repository.interface";

describe("CuratorService", () => {
  let curatorService: CuratorService;
  let mockGateway: IGatewayService;
  let mockSettingsRepo: IAiSettingsRepository;

  beforeEach(() => {
    mockGateway = createMockGatewayService();
    mockSettingsRepo = createMockAiSettingsRepository();

    curatorService = new CuratorService(mockGateway, mockSettingsRepo);
  });

  describe("suggestCollections", () => {
    it("should suggest collections successfully with valid JSON", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue({
        apiKey: "test-key",
        provider: "openai",
      });

      const mockSuggestions = [
        {
          name: "RPG Favorites",
          description: "Best role-playing games",
          gameIds: ["game-1", "game-2"],
          confidence: 0.9,
        },
        {
          name: "Action Adventures",
          description: "Exciting action games",
          gameIds: ["game-3", "game-4"],
          confidence: 0.85,
        },
      ];

      mockGateway.generateCompletion = mock().mockResolvedValue({
        text: JSON.stringify(mockSuggestions),
        model: "gpt-4o-mini",
        tokensUsed: { prompt: 100, completion: 200, total: 300 },
      });

      const result = await curatorService.suggestCollections("user-1", [
        "game-1",
        "game-2",
        "game-3",
        "game-4",
      ]);

      expect(mockSettingsRepo.getGatewayConfig).toHaveBeenCalledWith("user-1");
      expect(mockGateway.generateCompletion).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSuggestions);
    });

    it("should return empty array for invalid JSON response", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue({
        apiKey: "test-key",
        provider: "openai",
      });

      mockGateway.generateCompletion = mock().mockResolvedValue({
        text: "This is not valid JSON",
        model: "gpt-4o-mini",
        tokensUsed: { prompt: 100, completion: 50, total: 150 },
      });

      const result = await curatorService.suggestCollections("user-1", ["game-1", "game-2"]);

      expect(result).toEqual([]);
    });

    it("should throw ConfigurationError when AI settings not configured", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue(null);

      await expect(
        curatorService.suggestCollections("user-1", ["game-1", "game-2"])
      ).rejects.toThrow(ConfigurationError);

      expect(mockGateway.generateCompletion).not.toHaveBeenCalled();
    });

    it("should handle valid JSON with incomplete structure", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue({
        apiKey: "test-key",
        provider: "openai",
      });

      // Return valid JSON but with incomplete suggestion structure
      mockGateway.generateCompletion = mock().mockResolvedValue({
        text: '[{"name": "incomplete", "description": "", "gameIds": [], "confidence": 0.5}]',
        model: "gpt-4o-mini",
        tokensUsed: { prompt: 100, completion: 50, total: 150 },
      });

      const result = await curatorService.suggestCollections("user-1", ["game-1"]);

      // Service parses JSON but doesn't validate structure deeply
      expect(result).toEqual([
        { name: "incomplete", description: "", gameIds: [], confidence: 0.5 },
      ]);
    });
  });

  describe("suggestNextGame", () => {
    it("should suggest next games successfully with valid JSON", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue({
        apiKey: "test-key",
        provider: "xai",
      });

      const mockSuggestions = [
        {
          gameId: "game-5",
          reason: "Similar gameplay to your recent favorites",
          confidence: 0.95,
        },
        {
          gameId: "game-6",
          reason: "Completes the trilogy you started",
          confidence: 0.88,
        },
      ];

      mockGateway.generateCompletion = mock().mockResolvedValue({
        text: JSON.stringify(mockSuggestions),
        model: "gpt-4o-mini",
        tokensUsed: { prompt: 150, completion: 250, total: 400 },
      });

      const result = await curatorService.suggestNextGame("user-1", ["game-1", "game-2", "game-3"]);

      expect(mockSettingsRepo.getGatewayConfig).toHaveBeenCalledWith("user-1");
      expect(mockGateway.generateCompletion).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSuggestions);
    });

    it("should return empty array for invalid JSON response", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue({
        apiKey: "test-key",
        provider: "openai",
      });

      mockGateway.generateCompletion = mock().mockResolvedValue({
        text: "Invalid response format",
        model: "gpt-4o-mini",
        tokensUsed: { prompt: 100, completion: 30, total: 130 },
      });

      const result = await curatorService.suggestNextGame("user-1", ["game-1"]);

      expect(result).toEqual([]);
    });

    it("should throw ConfigurationError when AI settings not configured", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue(null);

      await expect(curatorService.suggestNextGame("user-1", ["game-1"])).rejects.toThrow(
        ConfigurationError
      );

      expect(mockGateway.generateCompletion).not.toHaveBeenCalled();
    });

    it("should handle empty game list", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue({
        apiKey: "test-key",
        provider: "openai",
      });

      mockGateway.generateCompletion = mock().mockResolvedValue({
        text: "[]",
        model: "gpt-4o-mini",
        tokensUsed: { prompt: 50, completion: 10, total: 60 },
      });

      const result = await curatorService.suggestNextGame("user-1", []);

      expect(result).toEqual([]);
    });
  });
});
