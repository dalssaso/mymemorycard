import "reflect-metadata";
import { describe, it, expect, beforeEach, mock } from "bun:test";
import { AiSettingsRepository } from "@/features/ai/repositories/ai-settings.repository";
import {
  createMockDrizzleDB,
  mockSelectResult,
  mockInsertResult,
} from "@/tests/helpers/drizzle.mocks";
import { createMockLogger } from "@/tests/helpers/repository.mocks";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import type { Logger } from "@/infrastructure/logging/logger";
import type { UserAiSettings } from "@/features/ai/types";

// Mock the encryption module
const mockDecrypt = mock((value: string) => `decrypted_${value}`);

mock.module("@/lib/encryption", () => ({
  decrypt: mockDecrypt,
}));

describe("AiSettingsRepository", () => {
  let repository: AiSettingsRepository;
  let mockDb: DrizzleDB;
  let mockLogger: Logger;

  beforeEach(() => {
    mockDb = createMockDrizzleDB();
    mockLogger = createMockLogger();
    repository = new AiSettingsRepository(mockDb, mockLogger);
    mockDecrypt.mockClear();
  });

  describe("findByUserId", () => {
    it("should return settings if found", async () => {
      const mockSettings: UserAiSettings = {
        userId: "user-123",
        provider: "openai",
        baseUrl: null,
        apiKeyEncrypted: "encrypted-key",
        model: "gpt-4o-mini",
        imageApiKeyEncrypted: null,
        imageModel: null,
        temperature: 0.7,
        maxTokens: 2000,
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
        collectionSuggestionsModel: "gpt-4o-mini",
        nextGameSuggestionsModel: "gpt-4o-mini",
        coverGenerationModel: "grok-2-image",
        enableSmartRouting: true,
        gatewayApiKeyEncrypted: "encrypted-gateway-key",
      };

      mockSelectResult(mockDb, [mockSettings]);

      const result = await repository.findByUserId("user-123");

      expect(result).toEqual(mockSettings);
    });

    it("should return null if settings not found", async () => {
      mockSelectResult(mockDb, []);

      const result = await repository.findByUserId("nonexistent-user");

      expect(result).toBeNull();
    });
  });

  describe("save", () => {
    it("should insert new settings", async () => {
      const newSettings: Partial<UserAiSettings> & { userId: string } = {
        userId: "user-456",
        provider: "openai",
        gatewayApiKeyEncrypted: "encrypted-key",
      };

      mockInsertResult(mockDb, [
        {
          ...newSettings,
          baseUrl: null,
          apiKeyEncrypted: null,
          model: "gpt-4o-mini",
          imageApiKeyEncrypted: null,
          imageModel: null,
          temperature: 0.7,
          maxTokens: 2000,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          collectionSuggestionsModel: "gpt-4o-mini",
          nextGameSuggestionsModel: "gpt-4o-mini",
          coverGenerationModel: "grok-2-image",
          enableSmartRouting: true,
        },
      ]);

      await repository.save(newSettings);

      // Verify the insert was called
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should update existing settings on conflict", async () => {
      const updateSettings: Partial<UserAiSettings> & { userId: string } = {
        userId: "user-123",
        provider: "openai",
        gatewayApiKeyEncrypted: "new-encrypted-key",
        temperature: 0.9,
      };

      mockInsertResult(mockDb, [
        {
          userId: "user-123",
          provider: "openai",
          baseUrl: null,
          apiKeyEncrypted: null,
          model: "gpt-4o-mini",
          imageApiKeyEncrypted: null,
          imageModel: null,
          temperature: 0.9,
          maxTokens: 2000,
          isActive: true,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date(),
          collectionSuggestionsModel: "gpt-4o-mini",
          nextGameSuggestionsModel: "gpt-4o-mini",
          coverGenerationModel: "grok-2-image",
          enableSmartRouting: true,
          gatewayApiKeyEncrypted: "new-encrypted-key",
        },
      ]);

      await repository.save(updateSettings);

      // Verify insert was called (with onConflictDoUpdate)
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("getGatewayConfig", () => {
    it("should return gateway config successfully", async () => {
      const mockSettings: UserAiSettings = {
        userId: "user-123",
        provider: "openai",
        baseUrl: null,
        apiKeyEncrypted: "encrypted-key",
        model: "gpt-4o-mini",
        imageApiKeyEncrypted: null,
        imageModel: null,
        temperature: 0.7,
        maxTokens: 2000,
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
        collectionSuggestionsModel: "gpt-4o-mini",
        nextGameSuggestionsModel: "gpt-4o-mini",
        coverGenerationModel: "grok-2-image",
        enableSmartRouting: true,
        gatewayApiKeyEncrypted: "encrypted-gateway-key",
      };

      mockSelectResult(mockDb, [mockSettings]);

      const result = await repository.getGatewayConfig("user-123");

      expect(result).toEqual({
        apiKey: "decrypted_encrypted-gateway-key",
        provider: "openai",
      });
      expect(mockDecrypt).toHaveBeenCalledWith("encrypted-gateway-key");
    });

    it("should return null when settings not found", async () => {
      mockSelectResult(mockDb, []);

      const result = await repository.getGatewayConfig("nonexistent-user");

      expect(result).toBeNull();
      expect(mockDecrypt).not.toHaveBeenCalled();
    });

    it("should return null when gateway API key is not set", async () => {
      const mockSettings: UserAiSettings = {
        userId: "user-123",
        provider: "openai",
        baseUrl: null,
        apiKeyEncrypted: "encrypted-key",
        model: "gpt-4o-mini",
        imageApiKeyEncrypted: null,
        imageModel: null,
        temperature: 0.7,
        maxTokens: 2000,
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
        collectionSuggestionsModel: "gpt-4o-mini",
        nextGameSuggestionsModel: "gpt-4o-mini",
        coverGenerationModel: "grok-2-image",
        enableSmartRouting: true,
        gatewayApiKeyEncrypted: null,
      };

      mockSelectResult(mockDb, [mockSettings]);

      const result = await repository.getGatewayConfig("user-123");

      expect(result).toBeNull();
      expect(mockDecrypt).not.toHaveBeenCalled();
    });
  });
});
