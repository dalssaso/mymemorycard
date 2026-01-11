import "reflect-metadata";
import { describe, it, expect, beforeEach } from "bun:test";
import { PostgresUserRepository } from "@/features/auth/repositories/user.repository";
import {
  createMockDrizzleDB,
  mockSelectResult,
  mockInsertResult,
  mockInsertError,
  mockSelectError,
} from "@/tests/helpers/drizzle.mocks";
import { ConflictError } from "@/shared/errors/base";
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

    it("should return null if user not found", async () => {
      mockSelectResult(mockDb, []);

      const result = await repository.findById("nonexistent");

      expect(result).toBeNull();
    });

    it("should propagate database errors", async () => {
      const dbError = new Error("Connection refused");
      mockSelectError(mockDb, dbError);

      await expect(repository.findById("user-123")).rejects.toThrow("Connection refused");
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

    it("should throw ConflictError for duplicate username", async () => {
      const error = new Error(
        'duplicate key value violates unique constraint "users_username_key"'
      );
      mockInsertError(mockDb, error);

      await expect(
        repository.create("existing", "new@example.com", "hashed_password")
      ).rejects.toThrow(ConflictError);
    });

    it("should throw ConflictError with specific username message", async () => {
      const error = new Error(
        'duplicate key value violates unique constraint "users_username_key"'
      );
      mockInsertError(mockDb, error);

      try {
        await repository.create("existing", "new@example.com", "hashed_password");
        expect.unreachable("Should have thrown ConflictError");
      } catch (err) {
        expect(err).toBeInstanceOf(ConflictError);
        expect((err as Error).message).toContain("existing");
        expect((err as Error).message).toContain("already exists");
      }
    });

    it("should throw ConflictError for duplicate email", async () => {
      const error = new Error('duplicate key value violates unique constraint "users_email_key"');
      mockInsertError(mockDb, error);

      await expect(
        repository.create("newuser", "existing@example.com", "hashed_password")
      ).rejects.toThrow(ConflictError);
    });

    it("should throw ConflictError with specific email message", async () => {
      const error = new Error('duplicate key value violates unique constraint "users_email_key"');
      mockInsertError(mockDb, error);

      try {
        await repository.create("newuser", "existing@example.com", "hashed_password");
        expect.unreachable("Should have thrown ConflictError");
      } catch (err) {
        expect(err).toBeInstanceOf(ConflictError);
        expect((err as Error).message).toContain("existing@example.com");
        expect((err as Error).message).toContain("already exists");
      }
    });

    it("should throw descriptive error if insert returns empty array", async () => {
      mockInsertResult(mockDb, []);

      await expect(
        repository.create("newuser", "new@example.com", "hashed_password")
      ).rejects.toThrow("Failed to create user: insert returned no rows");
    });

    it("should wrap non-ConflictError database errors with context", async () => {
      const dbError = new Error("Connection timeout");
      mockInsertError(mockDb, dbError);

      try {
        await repository.create("newuser", "new@example.com", "hashed_password");
        expect.unreachable("Should have thrown Error");
      } catch (err) {
        expect((err as Error).message).toContain("Failed to create user");
        expect((err as Error).message).toContain("Connection timeout");
      }
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

    it("should propagate database connection errors", async () => {
      const dbError = new Error("Connection refused");
      mockSelectError(mockDb, dbError);

      await expect(repository.exists("testuser")).rejects.toThrow("Connection refused");
    });
  });
});
