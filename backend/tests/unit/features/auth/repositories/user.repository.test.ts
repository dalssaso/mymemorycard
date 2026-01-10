import "reflect-metadata";
import { describe, it, expect, beforeEach } from "bun:test";
import { PostgresUserRepository } from "@/features/auth/repositories/user.repository";
import {
  createMockDrizzleDB,
  mockSelectResult,
  mockInsertResult,
} from "@/tests/helpers/drizzle.mocks";
import type { DrizzleDB } from "@/infrastructure/database/connection";

describe("PostgresUserRepository", () => {
  let repository: PostgresUserRepository;
  let mockDb: DrizzleDB;

  beforeEach(() => {
    mockDb = createMockDrizzleDB();
    repository = new PostgresUserRepository(mockDb);
  });

  describe("findByUsername", () => {
    it("should return user if found", async () => {
      const mockUser = {
        id: "user-123",
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hashed",
        createdAt: new Date(),
        updatedAt: null,
      };

      mockSelectResult(mockDb, [mockUser]);

      const result = await repository.findByUsername("testuser");

      expect(result).toEqual(mockUser);
    });

    it("should return null if not found", async () => {
      mockSelectResult(mockDb, []);

      const result = await repository.findByUsername("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("should return user if found", async () => {
      const mockUser = {
        id: "user-123",
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hashed",
        createdAt: new Date(),
        updatedAt: null,
      };

      mockSelectResult(mockDb, [mockUser]);

      const result = await repository.findById("user-123");

      expect(result).toEqual(mockUser);
    });
  });

  describe("exists", () => {
    it("should return true if user exists", async () => {
      mockSelectResult(mockDb, [{ id: "user-123" }]);

      const result = await repository.exists("testuser");

      expect(result).toBe(true);
    });

    it("should return false if user does not exist", async () => {
      mockSelectResult(mockDb, []);

      const result = await repository.exists("nonexistent");

      expect(result).toBe(false);
    });
  });

  describe("create", () => {
    it("should create and return user", async () => {
      const mockUser = {
        id: "new-user-id",
        username: "newuser",
        email: "new@example.com",
        passwordHash: "hashed_password",
        createdAt: new Date(),
        updatedAt: null,
      };

      mockInsertResult(mockDb, [mockUser]);

      const result = await repository.create("newuser", "new@example.com", "hashed_password");

      expect(result).toEqual(mockUser);
    });
  });
});
