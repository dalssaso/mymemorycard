import "reflect-metadata";
import { describe, it, expect, beforeEach, mock } from "bun:test";
import { ImageService } from "@/features/ai/services/image.service";
import {
  createMockGatewayService,
  createMockAiSettingsRepository,
} from "@/tests/helpers/repository.mocks";
import { NotFoundError } from "@/shared/errors/base";
import type { IGatewayService } from "@/features/ai/services/gateway.service.interface";
import type { IAiSettingsRepository } from "@/features/ai/repositories/ai-settings.repository.interface";

describe("ImageService", () => {
  let imageService: ImageService;
  let mockGateway: IGatewayService;
  let mockSettingsRepo: IAiSettingsRepository;

  beforeEach(() => {
    mockGateway = createMockGatewayService();
    mockSettingsRepo = createMockAiSettingsRepository();

    imageService = new ImageService(mockGateway, mockSettingsRepo);
  });

  describe("generateCollectionCover", () => {
    it("should generate collection cover successfully", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue({
        apiKey: "test-key",
        provider: "openai",
      });

      const mockGenerateImage = mock().mockResolvedValue({
        url: "https://example.com/generated-cover.png",
        model: "grok-2-image",
      });
      mockGateway.generateImage = mockGenerateImage;

      const result = await imageService.generateCollectionCover("user-1", "RPG Classics", [
        "Final Fantasy VII",
        "Chrono Trigger",
        "Secret of Mana",
      ]);

      expect(mockSettingsRepo.getGatewayConfig).toHaveBeenCalledWith("user-1");
      expect(mockGateway.generateImage).toHaveBeenCalledTimes(1);

      const callArgs = mockGenerateImage.mock.calls[0];
      expect(callArgs[0]).toContain("RPG Classics");
      expect(callArgs[0]).toContain("Final Fantasy VII");
      expect(callArgs[0]).toContain("Chrono Trigger");
      expect(callArgs[0]).toContain("Secret of Mana");

      expect(result.url).toBe("https://example.com/generated-cover.png");
      expect(result.model).toBe("grok-2-image");
    });

    it("should force xAI provider for image generation", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue({
        apiKey: "test-key",
        provider: "openai",
      });

      const mockGenerateImage = mock().mockResolvedValue({
        url: "https://example.com/image.png",
        model: "grok-2-image",
      });
      mockGateway.generateImage = mockGenerateImage;

      await imageService.generateCollectionCover("user-1", "Test Collection", ["Game 1", "Game 2"]);

      expect(mockGateway.generateImage).toHaveBeenCalledTimes(1);

      const callArgs = mockGenerateImage.mock.calls[0];
      const config = callArgs[1];

      // Should override provider to xAI
      expect(config.provider).toBe("xai");
      expect(config.apiKey).toBe("test-key");
    });

    it("should throw NotFoundError when AI settings not configured", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue(null);

      await expect(
        imageService.generateCollectionCover("user-1", "Test Collection", ["Game 1"])
      ).rejects.toThrow(NotFoundError);

      expect(mockGateway.generateImage).not.toHaveBeenCalled();
    });

    it("should limit game names to first 5 in prompt", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue({
        apiKey: "test-key",
        provider: "openai",
      });

      const mockGenerateImage = mock().mockResolvedValue({
        url: "https://example.com/image.png",
        model: "grok-2-image",
      });
      mockGateway.generateImage = mockGenerateImage;

      const manyGames = [
        "Game 1",
        "Game 2",
        "Game 3",
        "Game 4",
        "Game 5",
        "Game 6",
        "Game 7",
        "Game 8",
      ];

      await imageService.generateCollectionCover("user-1", "Big Collection", manyGames);

      const callArgs = mockGenerateImage.mock.calls[0];
      const prompt = callArgs[0];

      // Should include first 5
      expect(prompt).toContain("Game 1");
      expect(prompt).toContain("Game 2");
      expect(prompt).toContain("Game 3");
      expect(prompt).toContain("Game 4");
      expect(prompt).toContain("Game 5");

      // Should not include 6-8
      expect(prompt).not.toContain("Game 6");
      expect(prompt).not.toContain("Game 7");
      expect(prompt).not.toContain("Game 8");
    });

    it("should handle collection with fewer than 5 games", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue({
        apiKey: "test-key",
        provider: "xai",
      });

      const mockGenerateImage = mock().mockResolvedValue({
        url: "https://example.com/image.png",
        model: "grok-2-image",
      });
      mockGateway.generateImage = mockGenerateImage;

      await imageService.generateCollectionCover("user-1", "Small Collection", [
        "Game A",
        "Game B",
      ]);

      const callArgs = mockGenerateImage.mock.calls[0];
      const prompt = callArgs[0];

      expect(prompt).toContain("Small Collection");
      expect(prompt).toContain("Game A");
      expect(prompt).toContain("Game B");
    });

    it("should handle empty game names array with fallback text", async () => {
      mockSettingsRepo.getGatewayConfig = mock().mockResolvedValue({
        apiKey: "test-key",
        provider: "xai",
      });

      const mockGenerateImage = mock().mockResolvedValue({
        url: "https://example.com/image.png",
        model: "grok-2-image",
      });
      mockGateway.generateImage = mockGenerateImage;

      await imageService.generateCollectionCover("user-1", "Empty Collection", []);

      const callArgs = mockGenerateImage.mock.calls[0];
      const prompt = callArgs[0];

      expect(prompt).toContain("Empty Collection");
      expect(prompt).toContain("various popular titles");
      expect(prompt).not.toContain("featuring games like: .");
    });
  });
});
