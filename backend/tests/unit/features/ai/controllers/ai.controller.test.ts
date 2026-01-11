import "reflect-metadata";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { container } from "tsyringe";
import { AiController } from "@/features/ai/controllers/ai.controller";
import {
  createMockEmbeddingService,
  createMockCuratorService,
  createMockImageService,
  createMockTokenService,
  createMockUserRepository,
} from "@/tests/helpers/repository.mocks";

describe("AiController", () => {
  beforeEach(() => {
    // Register required dependencies for createAuthMiddleware
    container.register("ITokenService", { useValue: createMockTokenService() });
    container.register("IUserRepository", { useValue: createMockUserRepository() });
  });

  afterEach(() => {
    // Clean up DI container after each test
    container.clearInstances();
  });

  it("should instantiate controller with dependencies", () => {
    const mockEmbeddingService = createMockEmbeddingService();
    const mockCuratorService = createMockCuratorService();
    const mockImageService = createMockImageService();

    const controller = new AiController(mockEmbeddingService, mockCuratorService, mockImageService);

    expect(controller).toBeDefined();
    expect(controller.router).toBeDefined();
  });
});
