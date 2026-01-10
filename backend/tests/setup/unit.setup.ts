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
  },
  rawg: {
    apiKey: "test-rawg-key",
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
      const regex = new RegExp(pattern.replace("*", ".*"));
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
