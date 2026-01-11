import { mock } from "bun:test";
import type { IUserRepository } from "@/features/auth/repositories/user.repository.interface";
import type { IPasswordHasher } from "@/features/auth/services/password-hasher.interface";
import type { ITokenService } from "@/features/auth/services/token.service.interface";
import type { InferSelectModel } from "drizzle-orm";
import { type users } from "@/db/schema";
import type { Logger } from "@/infrastructure/logging/logger";
import type { MetricsService } from "@/infrastructure/metrics/metrics";
import type {
  EmbeddingResult,
  CompletionResult,
  ImageResult,
  UserAiSettings,
} from "@/features/ai/types";

type User = InferSelectModel<typeof users>;

export function createMockUserRepository(overrides?: Partial<IUserRepository>): IUserRepository {
  return {
    findByUsername: mock().mockResolvedValue(null),
    findById: mock().mockResolvedValue(null),
    create: mock().mockImplementation(
      async (username: string, email: string, passwordHash: string) => ({
        id: "test-user-id",
        username,
        email,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ),
    exists: mock().mockResolvedValue(false),
    ...overrides,
  };
}

export function createMockPasswordHasher(overrides?: Partial<IPasswordHasher>): IPasswordHasher {
  return {
    hash: mock().mockImplementation(async (password: string) => `hashed_${password}`),
    compare: mock().mockImplementation(
      async (password: string, hash: string) => hash === `hashed_${password}`
    ),
    ...overrides,
  };
}

export function createMockTokenService(overrides?: Partial<ITokenService>): ITokenService {
  return {
    generateToken: mock().mockImplementation((payload) => `token_${payload.userId}`),
    verifyToken: mock().mockImplementation((token) => {
      if (token.startsWith("token_")) {
        const userId = token.replace("token_", "");
        return { userId, username: "testuser" };
      }
      return null;
    }),
    ...overrides,
  };
}

export function createTestUser(overrides?: Partial<User>): User {
  return {
    id: "test-user-id",
    username: "testuser",
    email: "testuser@users.mymemorycard.local",
    passwordHash: "hashed_password123",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

export function createMockLogger(): Logger {
  const mockLogger = {
    debug: mock(),
    info: mock(),
    warn: mock(),
    error: mock(),
    child: mock().mockReturnThis(),
  };
  return mockLogger as unknown as Logger;
}

export function createMockMetricsService(): MetricsService {
  const mockMetrics = {
    httpRequestsTotal: {
      inc: mock(),
    },
    httpRequestDuration: {
      observe: mock(),
    },
    authAttemptsTotal: {
      inc: mock(),
    },
    registry: {
      contentType: "text/plain",
    },
    getMetrics: mock().mockResolvedValue("# metrics"),
  };
  return mockMetrics as unknown as MetricsService;
}

// ============================================================================
// AI Domain Mocks
// ============================================================================

export type MockGatewayService = {
  generateEmbedding: ReturnType<typeof mock>;
  generateCompletion: ReturnType<typeof mock>;
  streamCompletion: ReturnType<typeof mock>;
  generateImage: ReturnType<typeof mock>;
};

export function createMockGatewayService(
  overrides?: Partial<MockGatewayService>
): MockGatewayService {
  return {
    generateEmbedding: mock().mockResolvedValue({
      embedding: new Array(1536).fill(0.1),
      model: "text-embedding-3-small",
      tokensUsed: 100,
    } as EmbeddingResult),
    generateCompletion: mock().mockResolvedValue({
      text: "Mock completion response",
      model: "gpt-4o-mini",
      tokensUsed: { prompt: 50, completion: 100, total: 150 },
    } as CompletionResult),
    streamCompletion: mock().mockImplementation(async function* () {
      yield "Mock ";
      yield "streamed ";
      yield "response";
    }),
    generateImage: mock().mockResolvedValue({
      url: "https://example.com/image.png",
      model: "grok-2-image",
    } as ImageResult),
    ...overrides,
  };
}

export function createTestAiSettings(overrides?: Partial<UserAiSettings>): UserAiSettings {
  return {
    userId: "test-user-id",
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
    updatedAt: new Date("2024-01-01"),
    collectionSuggestionsModel: "gpt-4o-mini",
    nextGameSuggestionsModel: "gpt-4o-mini",
    coverGenerationModel: "grok-2-image",
    enableSmartRouting: true,
    gatewayApiKeyEncrypted: "encrypted-gateway-key",
    ...overrides,
  };
}

export type MockAiSettingsRepository = {
  findByUserId: ReturnType<typeof mock>;
  save: ReturnType<typeof mock>;
  getGatewayConfig: ReturnType<typeof mock>;
};

export function createMockAiSettingsRepository(
  overrides?: Partial<MockAiSettingsRepository>
): MockAiSettingsRepository {
  return {
    findByUserId: mock().mockResolvedValue(null),
    save: mock().mockResolvedValue(undefined),
    getGatewayConfig: mock().mockResolvedValue({
      apiKey: "test-gateway-key",
      provider: "openai" as const,
    }),
    ...overrides,
  };
}

export type MockEmbeddingRepository = {
  findByGameId: ReturnType<typeof mock>;
  findByCollectionId: ReturnType<typeof mock>;
  saveGameEmbedding: ReturnType<typeof mock>;
  saveCollectionEmbedding: ReturnType<typeof mock>;
  findSimilarGames: ReturnType<typeof mock>;
  findSimilarCollections: ReturnType<typeof mock>;
};

export function createMockEmbeddingRepository(
  overrides?: Partial<MockEmbeddingRepository>
): MockEmbeddingRepository {
  return {
    findByGameId: mock().mockResolvedValue(null),
    findByCollectionId: mock().mockResolvedValue(null),
    saveGameEmbedding: mock().mockResolvedValue(undefined),
    saveCollectionEmbedding: mock().mockResolvedValue(undefined),
    findSimilarGames: mock().mockResolvedValue([]),
    findSimilarCollections: mock().mockResolvedValue([]),
    ...overrides,
  };
}

export type MockEmbeddingService = {
  generateGameEmbedding: ReturnType<typeof mock>;
  generateCollectionEmbedding: ReturnType<typeof mock>;
  findSimilarGames: ReturnType<typeof mock>;
  findSimilarCollections: ReturnType<typeof mock>;
};

export function createMockEmbeddingService(
  overrides?: Partial<MockEmbeddingService>
): MockEmbeddingService {
  return {
    generateGameEmbedding: mock().mockResolvedValue(undefined),
    generateCollectionEmbedding: mock().mockResolvedValue(undefined),
    findSimilarGames: mock().mockResolvedValue([]),
    findSimilarCollections: mock().mockResolvedValue([]),
    ...overrides,
  };
}

export type MockCuratorService = {
  suggestCollections: ReturnType<typeof mock>;
  suggestNextGame: ReturnType<typeof mock>;
};

export function createMockCuratorService(
  overrides?: Partial<MockCuratorService>
): MockCuratorService {
  return {
    suggestCollections: mock().mockResolvedValue([]),
    suggestNextGame: mock().mockResolvedValue([]),
    ...overrides,
  };
}

export type MockImageService = {
  generateCollectionCover: ReturnType<typeof mock>;
};

export function createMockImageService(overrides?: Partial<MockImageService>): MockImageService {
  return {
    generateCollectionCover: mock().mockResolvedValue({
      url: "https://example.com/image.png",
      model: "test-model",
    }),
    ...overrides,
  };
}
