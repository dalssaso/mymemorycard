import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { PlatformController } from "@/features/platforms/controllers/platform.controller";
import type { IPlatformService } from "@/features/platforms/services/platform.service.interface";
import { createMockLogger } from "@/tests/helpers/repository.mocks";
import { container, resetContainer } from "@/container";
import type { ITokenService } from "@/features/auth/services/token.service.interface";
import type { IUserRepository } from "@/features/auth/repositories/user.repository.interface";
import type { PlatformListResponse } from "@/features/platforms/dtos/platform.dto";

describe("PlatformController", () => {
  let controller: PlatformController;
  let service: IPlatformService;

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

    service = {
      list: async () => ({
        platforms: [
          {
            id: "plat-1",
            name: "pc",
            display_name: "PC",
            platform_type: "pc",
            is_system: true,
            is_physical: false,
            website_url: null,
            color_primary: "#6B7280",
            default_icon_url: null,
            sort_order: 0,
          },
        ],
      }),
      getById: async () => ({
        platform: {
          id: "plat-1",
          name: "pc",
          display_name: "PC",
          platform_type: "pc",
          is_system: true,
          is_physical: false,
          website_url: null,
          color_primary: "#6B7280",
          default_icon_url: null,
          sort_order: 0,
        },
      }),
    };

    controller = new PlatformController(service, createMockLogger());
  });

  afterEach(() => {
    resetContainer();
  });

  it("exposes a router", () => {
    expect(controller.router).toBeDefined();
  });

  it("returns platforms when authenticated", async () => {
    const response = await controller.router.request("/", {
      headers: {
        Authorization: "Bearer token",
      },
    });

    expect(response.status).toBe(200);
    const data = (await response.json()) as PlatformListResponse;
    expect(data.platforms).toBeDefined();
  });

  it("returns 401 when missing auth", async () => {
    const response = await controller.router.request("/");

    expect(response.status).toBe(401);
  });
});
