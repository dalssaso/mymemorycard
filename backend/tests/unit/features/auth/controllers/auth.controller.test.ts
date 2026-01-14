import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { AuthController } from "@/features/auth/controllers/auth.controller";
import type { IAuthService } from "@/features/auth/services/auth.service.interface";
import { Logger } from "@/infrastructure/logging/logger";
import { container, resetContainer } from "@/container";
import type { ITokenService } from "@/features/auth/services/token.service.interface";
import type { IUserRepository } from "@/features/auth/repositories/user.repository.interface";

describe("AuthController", () => {
  let controller: AuthController;
  let mockAuthService: IAuthService;
  let mockLogger: Logger;

  beforeEach(() => {
    resetContainer();

    container.registerInstance<ITokenService>("ITokenService", {
      generateToken: () => "token",
      verifyToken: () => ({ userId: "user-1", username: "testuser" }),
    });

    container.registerInstance<IUserRepository>("IUserRepository", {
      findById: async () => ({
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hash",
        createdAt: new Date(),
        updatedAt: null,
      }),
      findByUsername: async () => null,
      create: async () => {
        throw new Error("not used");
      },
      exists: async () => false,
    });

    mockAuthService = {
      register: mock().mockResolvedValue({
        user: { id: "user-123", username: "testuser", email: "test@example.com" },
        token: "test-token",
      }),
      login: mock().mockResolvedValue({
        user: { id: "user-123", username: "testuser", email: "test@example.com" },
        token: "test-token",
      }),
      validateToken: mock().mockResolvedValue(null),
    };

    mockLogger = new Logger().child("AuthController");

    controller = new AuthController(mockAuthService, mockLogger);
  });

  afterEach(() => {
    resetContainer();
  });

  it("should have router instance", () => {
    expect(controller.router).toBeDefined();
  });

  it("should create controller with injected dependencies", () => {
    expect(controller).toBeInstanceOf(AuthController);
  });
});
