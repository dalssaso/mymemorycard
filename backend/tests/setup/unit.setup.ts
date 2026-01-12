/**
 * Unit Test Setup
 *
 * This file mocks external dependencies (db, redis, external APIs)
 * so unit tests can run without any external services.
 *
 * Run unit tests with: bun test --preload ./tests/setup/unit.setup.ts ./tests/unit
 */

import "reflect-metadata";
import { container } from "@/container";
import type { IConfig } from "@/infrastructure/config/config.interface";
import type { ITokenService, JWTPayload } from "@/features/auth/services/token.service.interface";
import type { IUserRepository } from "@/features/auth/repositories/user.repository.interface";
import type { User } from "@/features/auth/types";

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
  findById: async (id: string): Promise<User | null> => ({
    id,
    username: "testuser",
    email: "test@example.com",
    passwordHash: "hashed-password",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  findByUsername: async (username: string): Promise<User | null> => ({
    id: "mock-user-id",
    username,
    email: `${username}@example.com`,
    passwordHash: "hashed-password",
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  create: async (
    username: string,
    email: string,
    passwordHash: string
  ): Promise<User> => ({
    id: "new-user-id",
    username,
    email,
    passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  exists: async (_username: string): Promise<boolean> => false,
};

container.register<IUserRepository>("IUserRepository", {
  useValue: mockUserRepository,
});