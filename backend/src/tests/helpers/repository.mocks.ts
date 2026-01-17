import { mock } from "bun:test";

import type { InferSelectModel } from "drizzle-orm";

import { type users } from "@/db/schema";
import type { IConfig } from "@/infrastructure/config/config.interface";
import { IgdbCache } from "@/integrations/igdb/igdb.cache";
import type { IRateLimiter } from "@/integrations/igdb/igdb.rate-limiter";
import type { IAdminRepository } from "@/features/admin/repositories/admin.repository.interface";
import type { IAdminService } from "@/features/admin/services/admin.service.interface";
import type { AdminSetting, AdminSettingsResponse } from "@/features/admin/types";
import type { IUserRepository } from "@/features/auth/repositories/user.repository.interface";
import type { IPasswordHasher } from "@/features/auth/services/password-hasher.interface";
import type { ITokenService } from "@/features/auth/services/token.service.interface";
import type {
  IUserCredentialRepository,
  UpsertCredentialData,
} from "@/features/credentials/repositories/user-credential.repository.interface";
import type { IEncryptionService } from "@/features/credentials/services/encryption.service.interface";
import type { ApiService, UserApiCredential } from "@/features/credentials/types";
import type { IPreferencesRepository } from "@/features/preferences/repositories/preferences.repository.interface";
import type { UserPreference } from "@/features/preferences/types";
import type { Logger } from "@/infrastructure/logging/logger";
import type { MetricsService } from "@/infrastructure/metrics/metrics";
import type { IIgdbService } from "@/integrations/igdb";
import {
  mapIgdbGameToSearchResult,
  mapIgdbGameToGameDetails,
  mapIgdbPlatformToPlatform,
} from "@/integrations/igdb";
import {
  IGDB_TOKEN_FIXTURE,
  IGDB_SEARCH_RESULTS_FIXTURE,
  IGDB_GAME_FIXTURE,
  IGDB_PLATFORM_FIXTURE,
  IGDB_FRANCHISE_FIXTURE,
} from "@/tests/helpers/igdb.fixtures";

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
        isAdmin: false,
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
    isAdmin: false,
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

/**
 * Create a mock preferences repository with default implementations.
 *
 * @param overrides - Optional partial overrides for specific methods.
 * @returns Mocked IPreferencesRepository.
 */
export function createMockPreferencesRepository(
  overrides?: Partial<IPreferencesRepository>
): IPreferencesRepository {
  const defaultPreferences: UserPreference = {
    userId: "test-user-id",
    defaultView: "grid",
    itemsPerPage: 25,
    theme: "dark",
    updatedAt: new Date("2026-01-15T10:00:00Z"),
  };

  return {
    findByUserId: mock().mockResolvedValue(null),
    upsert: mock().mockResolvedValue(defaultPreferences),
    ...overrides,
  };
}

/**
 * Create a mock admin repository with default implementations.
 *
 * @param overrides - Optional partial overrides for specific methods.
 * @returns Mocked IAdminRepository.
 */
export function createMockAdminRepository(overrides?: Partial<IAdminRepository>): IAdminRepository {
  const defaultSettings: AdminSetting = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    analyticsEnabled: false,
    analyticsProvider: null,
    analyticsKey: null,
    analyticsHost: null,
    searchServerSide: true,
    searchDebounceMs: 300,
    updatedAt: new Date("2026-01-15T10:00:00Z"),
  };

  return {
    findSettings: mock().mockResolvedValue(null),
    upsert: mock().mockResolvedValue(defaultSettings),
    ...overrides,
  };
}

/**
 * Default admin settings response for mocks
 */
export const DEFAULT_ADMIN_SETTINGS_RESPONSE: AdminSettingsResponse = {
  analytics: {
    enabled: false,
    provider: null,
    key: null,
    host: null,
  },
  search: {
    server_side: true,
    debounce_ms: 300,
  },
};

/**
 * Create a mock admin service with default implementations.
 *
 * @param overrides - Optional partial overrides for specific methods.
 * @returns Mocked IAdminService.
 */
export function createMockAdminService(overrides?: Partial<IAdminService>): IAdminService {
  return {
    getSettings: mock().mockResolvedValue(DEFAULT_ADMIN_SETTINGS_RESPONSE),
    updateSettings: mock().mockResolvedValue(DEFAULT_ADMIN_SETTINGS_RESPONSE),
    ...overrides,
  };
}

/**
 * Create a mock encryption service with default implementations.
 *
 * @param overrides - Optional partial overrides for specific methods.
 * @returns Mocked IEncryptionService.
 *
 * @example
 * ```typescript
 * import { createMockEncryptionService } from "@/tests/helpers/repository.mocks";
 *
 * const mockEncryption = createMockEncryptionService();
 * const encrypted = mockEncryption.encrypt({ api_key: "secret" });
 * // encrypted === "encrypted-data-base64"
 *
 * // Override specific methods:
 * const customMock = createMockEncryptionService({
 *   decrypt: mock().mockReturnValue({ api_key: "decrypted-secret" }),
 * });
 * ```
 */
export function createMockEncryptionService(
  overrides?: Partial<IEncryptionService>
): IEncryptionService {
  return {
    encrypt: mock().mockReturnValue("encrypted-data-base64"),
    decrypt: mock().mockReturnValue({ decrypted: "data" }),
    ...overrides,
  };
}

/**
 * Create a mock user credential repository with default implementations.
 *
 * @param overrides - Optional partial overrides for specific methods.
 * @returns Mocked IUserCredentialRepository.
 *
 * @example
 * ```typescript
 * import { createMockUserCredentialRepository } from "@/tests/helpers/repository.mocks";
 *
 * const mockRepo = createMockUserCredentialRepository();
 * const credentials = await mockRepo.findByUser("user-id");
 * // credentials === []
 *
 * // Override specific methods:
 * const customMock = createMockUserCredentialRepository({
 *   findByUserAndService: mock().mockResolvedValue({ id: "cred-1", ... }),
 * });
 * ```
 */
export function createMockUserCredentialRepository(
  overrides?: Partial<IUserCredentialRepository>
): IUserCredentialRepository {
  const defaultCredential: UserApiCredential = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    userId: "test-user-id",
    service: "igdb" as ApiService,
    credentialType: "twitch_oauth",
    encryptedCredentials: "encrypted-data",
    isActive: true,
    hasValidToken: false,
    tokenExpiresAt: null,
    lastValidatedAt: null,
    createdAt: new Date("2026-01-16T10:00:00Z"),
    updatedAt: new Date("2026-01-16T10:00:00Z"),
  };

  return {
    findByUserAndService: mock().mockResolvedValue(null),
    findByUser: mock().mockResolvedValue([]),
    upsert: mock().mockImplementation(async (userId: string, data: UpsertCredentialData) => ({
      ...defaultCredential,
      userId,
      service: data.service,
      credentialType: data.credentialType,
      encryptedCredentials: data.encryptedCredentials,
      isActive: data.isActive ?? true,
      hasValidToken: data.hasValidToken ?? false,
      tokenExpiresAt: data.tokenExpiresAt ?? null,
    })),
    delete: mock().mockResolvedValue(undefined),
    updateValidationStatus: mock().mockImplementation(
      async (userId: string, service: ApiService, hasValidToken: boolean) => ({
        ...defaultCredential,
        userId,
        service,
        hasValidToken,
        lastValidatedAt: new Date(),
      })
    ),
    ...overrides,
  };
}

/**
 * Create a mock IGDB service with default implementations.
 *
 * @param overrides - Optional partial overrides for specific methods.
 * @returns Mocked IIgdbService.
 *
 * @example
 * ```typescript
 * import { createMockIgdbService } from "@/tests/helpers/repository.mocks"
 *
 * const mockIgdb = createMockIgdbService()
 * const results = await mockIgdb.searchGames("witcher", "user-id")
 * // returns mapped search results from fixtures
 *
 * // Override specific methods:
 * const customMock = createMockIgdbService({
 *   searchGames: mock().mockResolvedValue([]),
 * })
 * ```
 */
export function createMockIgdbService(overrides?: Partial<IIgdbService>): IIgdbService {
  return {
    authenticate: mock().mockResolvedValue(IGDB_TOKEN_FIXTURE),
    searchGames: mock().mockResolvedValue(
      IGDB_SEARCH_RESULTS_FIXTURE.map(mapIgdbGameToSearchResult)
    ),
    getGameDetails: mock().mockResolvedValue(mapIgdbGameToGameDetails(IGDB_GAME_FIXTURE)),
    getPlatform: mock().mockResolvedValue(mapIgdbPlatformToPlatform(IGDB_PLATFORM_FIXTURE)),
    getPlatforms: mock().mockResolvedValue([mapIgdbPlatformToPlatform(IGDB_PLATFORM_FIXTURE)]),
    getFranchise: mock().mockResolvedValue(IGDB_FRANCHISE_FIXTURE),
    ...overrides,
  };
}

/**
 * Create a mock IGDB cache with a mock Redis client.
 *
 * @returns IgdbCache instance with mocked Redis
 *
 * @example
 * ```typescript
 * import { createMockIgdbCache } from "@/tests/helpers/repository.mocks"
 *
 * const mockCache = createMockIgdbCache()
 * await mockCache.getCachedSearch("test")
 * ```
 */
export function createMockIgdbCache(): IgdbCache {
  const mockRedis = {
    get: mock().mockResolvedValue(null),
    setEx: mock().mockResolvedValue("OK"),
    del: mock().mockResolvedValue(1),
  };
  return new IgdbCache(mockRedis as never);
}

/**
 * Create a mock rate limiter that executes functions immediately.
 *
 * @returns Mocked IRateLimiter
 *
 * @example
 * ```typescript
 * import { createMockRateLimiter } from "@/tests/helpers/repository.mocks"
 *
 * const mockRateLimiter = createMockRateLimiter()
 * const result = await mockRateLimiter.schedule(async () => "result")
 * // Executes immediately without rate limiting
 * ```
 */
export function createMockRateLimiter(): IRateLimiter {
  return {
    schedule: mock().mockImplementation(async <T>(fn: () => Promise<T>) => fn()),
  };
}

/**
 * Create a mock config object with sensible defaults.
 *
 * @param overrides - Optional partial overrides for specific fields.
 * @returns Mocked IConfig.
 *
 * @example
 * ```typescript
 * import { createMockConfig } from "@/tests/helpers/repository.mocks"
 *
 * const config = createMockConfig()
 * // { database: { url: "..." }, redis: { url: "..." }, ... }
 *
 * // Override specific fields:
 * const customConfig = createMockConfig({
 *   skipRedisConnect: true,
 *   isProduction: true,
 * })
 * ```
 */
export function createMockConfig(overrides?: Partial<IConfig>): IConfig {
  return {
    database: { url: "postgresql://test:test@localhost:5432/test" },
    redis: { url: "redis://localhost:6379" },
    jwt: { secret: "test-secret", expiresIn: "1h" },
    rawg: { apiKey: "test-api-key" },
    encryption: { secret: "test-encryption-secret-32chars!!", salt: "test-salt-16chars" },
    port: 3000,
    cors: { origin: undefined, allowedOrigins: [] },
    bcrypt: { saltRounds: 10 },
    isProduction: false,
    skipRedisConnect: false,
    ...overrides,
  };
}
