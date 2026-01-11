/**
 * Unit Test Setup
 *
 * This file mocks external dependencies (db, redis, external APIs)
 * so unit tests can run without any external services.
 *
 * Run unit tests with: bun test --preload ./tests/setup/unit.setup.ts ./tests/unit
 */

import { mock } from "bun:test";
import "reflect-metadata";
import { container } from "@/container";
import type { IConfig } from "@/infrastructure/config/config.interface";
import type {
  ITokenService,
  JWTPayload,
} from "@/features/auth/services/token.service.interface";
import type { IUserRepository } from "@/features/auth/repositories/user.repository.interface";

// Register IConfig for tests
const mockConfig: IConfig = {
  database: {
    url: "postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard",
  },
  redis: {
    url: "redis://localhost:6380",
  },
  jwt: {
    secret: "test-jwt-secret",
    expiresIn: "7d",
  },
  rawg: {
    apiKey: "test-rawg-key",
  },
  encryption: {
    secret: "test-encryption-secret-very-long",
    salt: "test-salt",
  },
  port: 3000,
  cors: {
    origin: undefined,
    allowedOrigins: ["http://localhost:5173", "http://localhost:3000"],
  },
  bcrypt: {
    saltRounds: 10,
  },
  isProduction: false,
  skipRedisConnect: true,
};

container.register<IConfig>("IConfig", {
  useValue: mockConfig,
});

// Register mock ITokenService for auth middleware tests
const mockTokenService: ITokenService = {
  generateToken: (payload: JWTPayload): string => `mock-token-${payload.userId}`,
  verifyToken: (token: string): JWTPayload | null => {
    if (token.startsWith("mock-token-")) {
      return { userId: token.replace("mock-token-", ""), username: "testuser" };
    }
    return null;
  },
};

container.register<ITokenService>("ITokenService", {
  useValue: mockTokenService,
});

// Register mock IUserRepository for auth middleware tests
const mockUserRepository: IUserRepository = {
  findById: async (id: string) => ({
    id,
    username: "testuser",
    email: "test@example.com",
    passwordHash: "hashed-password",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  findByUsername: async () => null,
  create: async () => ({
    id: "new-user-id",
    username: "newuser",
    email: "new@example.com",
    passwordHash: "hashed-password",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  exists: async () => false,
};

container.register<IUserRepository>("IUserRepository", {
  useValue: mockUserRepository,
});

// Mock the database module
mock.module("@/services/db", () => {
  type QueryResult<T = unknown> = { rows: T[]; rowCount: number };

  const mockQuery = async <T = unknown>(
    _text: string,
    _params?: unknown[]
  ): Promise<QueryResult<T>> => {
    return { rows: [], rowCount: 0 };
  };

  const mockQueryOne = async <T = unknown>(
    _text: string,
    _params?: unknown[]
  ): Promise<T | null> => {
    return null;
  };

  const mockQueryMany = async <T = unknown>(_text: string, _params?: unknown[]): Promise<T[]> => {
    return [];
  };

  const mockWithTransaction = async <T>(callback: (client: unknown) => Promise<T>): Promise<T> => {
    const mockClient = {
      query: mockQuery,
    };
    return callback(mockClient);
  };

  const mockPool = {
    query: mockQuery,
    connect: async () => ({
      query: mockQuery,
      release: () => {},
    }),
    on: () => {},
  };

  return {
    query: mockQuery,
    queryOne: mockQueryOne,
    queryMany: mockQueryMany,
    withTransaction: mockWithTransaction,
    pool: mockPool,
    default: mockPool,
  };
});

// Mock the redis module
mock.module("@/services/redis", () => {
  const store = new Map<string, string>();

  const mockRedisClient = {
    isReady: true,
    connect: async () => {},
    disconnect: async () => {},
    quit: async () => {},
    get: async (key: string) => store.get(key) ?? null,
    set: async (key: string, value: string, _options?: unknown) => {
      store.set(key, value);
      return "OK";
    },
    del: async (key: string) => (store.delete(key) ? 1 : 0),
    setEx: async (key: string, _seconds: number, value: string) => {
      store.set(key, value);
      return "OK";
    },
    expire: async (_key: string, _seconds: number) => 1,
    keys: async (pattern: string) => {
      // Escape special regex characters and convert Redis glob pattern to regex
      const escapedPattern = pattern
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // Escape special regex chars
        .replace(/\*/g, ".*"); // Convert * (glob wildcard) to .* (regex)
      const regex = new RegExp(`^${escapedPattern}$`);
      return Array.from(store.keys()).filter((k) => regex.test(k));
    },
    incr: async (key: string) => {
      const current = parseInt(store.get(key) || "0", 10);
      const next = current + 1;
      store.set(key, next.toString());
      return next;
    },
    on: () => mockRedisClient,
  };

  return {
    default: mockRedisClient,
  };
});

// Mock external API calls (RAWG, etc.)
mock.module("@/services/rawg", () => {
  return {
    searchGames: async () => ({ results: [], count: 0 }),
    getGameDetails: async () => null,
    default: {
      searchGames: async () => ({ results: [], count: 0 }),
      getGameDetails: async () => null,
    },
  };
});
