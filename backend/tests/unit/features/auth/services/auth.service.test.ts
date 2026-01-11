import "reflect-metadata";
import { describe, it, expect, beforeEach } from "bun:test";
import { AuthService } from "@/features/auth/services/auth.service";
import {
  createMockUserRepository,
  createMockPasswordHasher,
  createMockTokenService,
  createTestUser,
  createMockLogger,
  createMockMetricsService,
} from "@/tests/helpers/repository.mocks";
import { ConflictError, UnauthorizedError } from "@/shared/errors/base";
import type { IUserRepository } from "@/features/auth/repositories/user.repository.interface";
import type { IPasswordHasher } from "@/features/auth/services/password-hasher.interface";
import type { ITokenService } from "@/features/auth/services/token.service.interface";
import type { Logger } from "@/infrastructure/logging/logger";
import type { MetricsService } from "@/infrastructure/metrics/metrics";

describe("AuthService", () => {
  let authService: AuthService;
  let mockUserRepo: IUserRepository;
  let mockPasswordHasher: IPasswordHasher;
  let mockTokenService: ITokenService;
  let mockLogger: Logger;
  let mockMetrics: MetricsService;

  beforeEach(() => {
    mockUserRepo = createMockUserRepository();
    mockPasswordHasher = createMockPasswordHasher();
    mockTokenService = createMockTokenService();
    mockLogger = createMockLogger();
    mockMetrics = createMockMetricsService();

    authService = new AuthService(
      mockUserRepo,
      mockPasswordHasher,
      mockTokenService,
      mockLogger,
      mockMetrics
    );
  });

  describe("register", () => {
    it("should register new user successfully", async () => {
      const result = await authService.register("newuser", "new@example.com", "SecurePass123!");

      expect(result.user.username).toBe("newuser");
      expect(result.user.email).toBe("new@example.com");
      expect(result.token).toBe("token_test-user-id");
    });

    it("should throw ConflictError if user already exists", async () => {
      // Repository throws ConflictError on database constraint violation (TOCTOU-safe pattern)
      mockUserRepo.create = async () => {
        throw new ConflictError("User already exists");
      };

      await expect(
        authService.register("existing", "existing@example.com", "password")
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("login", () => {
    it("should login user successfully", async () => {
      const testUser = createTestUser();
      mockUserRepo.findByUsername = async () => testUser;
      mockPasswordHasher.compare = async () => true;

      const result = await authService.login("testuser", "password123");

      expect(result.user.username).toBe("testuser");
      expect(result.token).toBe("token_test-user-id");
    });

    it("should throw UnauthorizedError for non-existent user", async () => {
      mockUserRepo.findByUsername = async () => null;

      await expect(authService.login("nonexistent", "password")).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError for wrong password", async () => {
      const testUser = createTestUser();
      mockUserRepo.findByUsername = async () => testUser;
      mockPasswordHasher.compare = async () => false;

      await expect(authService.login("testuser", "wrongpassword")).rejects.toThrow(
        UnauthorizedError
      );
    });

    it("should not leak user existence in error messages", async () => {
      // Test non-existent user
      mockUserRepo.findByUsername = async () => null;
      let error1: Error | null = null;
      try {
        await authService.login("nonexistent", "password");
      } catch (e) {
        error1 = e as Error;
      }

      // Test wrong password
      mockUserRepo.findByUsername = async () => createTestUser();
      mockPasswordHasher.compare = async () => false;
      let error2: Error | null = null;
      try {
        await authService.login("testuser", "wrongpassword");
      } catch (e) {
        error2 = e as Error;
      }

      expect(error1?.message).toBe(error2?.message);
      expect(error1?.message).toBe("Invalid credentials");
    });
  });

  describe("validateToken", () => {
    it("should return user for valid token", async () => {
      const testUser = createTestUser();
      mockUserRepo.findById = async () => testUser;

      const result = await authService.validateToken("token_test-user-id");

      expect(result).toEqual(testUser);
    });

    it("should return null for invalid token", async () => {
      mockTokenService.verifyToken = () => null;

      const result = await authService.validateToken("invalid_token");

      expect(result).toBeNull();
    });

    it("should return null if user not found", async () => {
      mockUserRepo.findById = async () => null;

      const result = await authService.validateToken("token_test-user-id");

      expect(result).toBeNull();
    });
  });
});
