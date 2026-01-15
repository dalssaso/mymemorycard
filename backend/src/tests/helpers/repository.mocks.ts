import { mock } from "bun:test";

import type { InferSelectModel } from "drizzle-orm";

import { type users } from "@/db/schema";
import type { IUserRepository } from "@/features/auth/repositories/user.repository.interface";
import type { IPasswordHasher } from "@/features/auth/services/password-hasher.interface";
import type { ITokenService } from "@/features/auth/services/token.service.interface";
import type { IPreferencesRepository } from "@/features/preferences/repositories/preferences.repository.interface";
import type { UserPreference } from "@/features/preferences/types";
import type { Logger } from "@/infrastructure/logging/logger";
import type { MetricsService } from "@/infrastructure/metrics/metrics";

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
