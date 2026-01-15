import { beforeEach, describe, expect, it } from "bun:test";
import "reflect-metadata";

import { UserPlatformsController } from "@/features/user-platforms/controllers/user-platforms.controller";
import type { IUserPlatformsController } from "@/features/user-platforms/controllers/user-platforms.controller.interface";
import type { IUserPlatformsService } from "@/features/user-platforms/services/user-platforms.service.interface";
import { createMockLogger } from "@/tests/helpers/repository.mocks";

const createMockService = (): IUserPlatformsService => ({
  getUserPlatforms: async () => [],
  addPlatform: async () => ({
    id: "test-id",
    user_id: "test-user-id",
    platform_id: "test-platform-id",
    username: undefined,
    icon_url: undefined,
    profile_url: undefined,
    notes: undefined,
    created_at: new Date().toISOString(),
  }),
  updatePlatform: async () => ({
    id: "test-id",
    user_id: "test-user-id",
    platform_id: "test-platform-id",
    username: undefined,
    icon_url: undefined,
    profile_url: undefined,
    notes: undefined,
    created_at: new Date().toISOString(),
  }),
  removePlatform: async () => {},
});

describe("UserPlatformsController", () => {
  let controller: IUserPlatformsController;
  let mockService: IUserPlatformsService;

  beforeEach(() => {
    mockService = createMockService();
    controller = new UserPlatformsController(mockService, createMockLogger());
  });

  describe("initialization", () => {
    it("should create controller instance", () => {
      expect(controller).toBeDefined();
    });

    it("should have router property", () => {
      expect(controller.router).toBeDefined();
    });

    it("should have OpenAPIHono router with correct type", () => {
      expect(controller.router).toBeDefined();
      // OpenAPIHono instances have routes map
      expect(typeof controller.router).toBe("object");
    });
  });
});
