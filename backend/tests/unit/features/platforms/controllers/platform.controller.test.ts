import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { PlatformController } from "@/features/platforms/controllers/platform.controller";
import type { IPlatformService } from "@/features/platforms/services/platform.service.interface";
import { createMockLogger } from "@/tests/helpers/repository.mocks";
import { container, resetContainer } from "@/container";
import type { ITokenService } from "@/features/auth/services/token.service.interface";
import type { IUserRepository } from "@/features/auth/repositories/user.repository.interface";
import type { PlatformListResponse } from "@/features/platforms/dtos/platform.dto";
import { TOKEN_SERVICE_TOKEN, USER_REPOSITORY_TOKEN } from "@/container/tokens";
import { NotFoundError } from "@/shared/errors/base";
import { createErrorHandler } from "@/infrastructure/http/middleware/error.middleware";

describe("PlatformController", () => {
  let controller: PlatformController;
  let service: IPlatformService;

  beforeEach(() => {
    resetContainer();

    container.registerInstance<ITokenService>(TOKEN_SERVICE_TOKEN, {
      generateToken: () => "token",
      verifyToken: () => ({ userId: "user-1", username: "testuser" }),
    });

    container.registerInstance<IUserRepository>(USER_REPOSITORY_TOKEN, {
      findById: async () => ({
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hash",
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: null,
      }),
      findByUsername: async () => null,
      create: async () => {
        throw new Error("not used");
      },
      exists: async () => false,
    });

    const platformId = "00000000-0000-4000-8000-000000000001";

    service = {
      list: async () => ({
        platforms: [
          {
            id: platformId,
            igdb_platform_id: 6,
            name: "PC (Windows)",
            abbreviation: "PC",
            slug: "win",
            platform_family: "PC",
            color_primary: "#6B7280",
            created_at: null,
          },
        ],
      }),
      getById: async () => ({
        platform: {
          id: platformId,
          igdb_platform_id: 6,
          name: "PC (Windows)",
          abbreviation: "PC",
          slug: "win",
          platform_family: "PC",
          color_primary: "#6B7280",
          created_at: null,
        },
      }),
      getByIgdbId: async () => ({
        platform: {
          id: platformId,
          igdb_platform_id: 6,
          name: "PC (Windows)",
          abbreviation: "PC",
          slug: "win",
          platform_family: "PC",
          color_primary: "#6B7280",
          created_at: null,
        },
      }),
    };

    const logger = createMockLogger();
    controller = new PlatformController(service, logger);
    controller.router.onError(createErrorHandler(logger));
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

  it("returns platform when authenticated", async () => {
    const response = await controller.router.request("/00000000-0000-4000-8000-000000000001", {
      headers: {
        Authorization: "Bearer token",
      },
    });

    expect(response.status).toBe(200);
    const data = (await response.json()) as { platform?: { id?: string } };
    expect(data.platform).toBeDefined();
  });

  it("returns 404 when platform is missing", async () => {
    service.getById = async () => {
      throw new NotFoundError("Platform", "missing");
    };

    const response = await controller.router.request("/00000000-0000-4000-8000-000000000002", {
      headers: {
        Authorization: "Bearer token",
      },
    });

    expect(response.status).toBe(404);
  });
});
