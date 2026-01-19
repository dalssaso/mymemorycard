import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import "reflect-metadata";

import { container, resetContainer } from "@/container";
import { TOKEN_SERVICE_TOKEN, USER_REPOSITORY_TOKEN } from "@/container/tokens";
import type { IUserRepository } from "@/features/auth/repositories/user.repository.interface";
import type { ITokenService } from "@/features/auth/services/token.service.interface";
import type { Config } from "@/infrastructure/config/config";
import { createErrorHandler } from "@/infrastructure/http/middleware/error.middleware";
import { SteamController } from "@/integrations/steam/steam.controller";
import type { ISteamService } from "@/integrations/steam/steam.service.interface";
import type { Logger } from "@/infrastructure/logging/logger";
import { UnprocessableEntityError } from "@/shared/errors/base";
import {
  createMockConfig,
  createMockLogger,
  createMockSteamService,
} from "@/tests/helpers/repository.mocks";

describe("SteamController", () => {
  let controller: SteamController;
  let mockService: ISteamService;
  let mockLogger: Logger;
  let mockConfig: Config;

  beforeEach(() => {
    resetContainer();

    // Register mock auth dependencies for middleware
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

    mockService = createMockSteamService();
    mockLogger = createMockLogger();
    mockConfig = createMockConfig();
    controller = new SteamController(mockService, mockLogger, mockConfig);
    controller.router.onError(createErrorHandler(mockLogger));
  });

  afterEach(() => {
    resetContainer();
  });

  describe("routes", () => {
    it("exposes a router", () => {
      expect(controller.router).toBeDefined();
    });

    it("registers /connect route", () => {
      const routes = controller.router.routes;
      const connectRoute = routes.find((r) => r.method === "GET" && r.path === "/connect");
      expect(connectRoute).toBeDefined();
    });

    it("registers /callback route", () => {
      const routes = controller.router.routes;
      const callbackRoute = routes.find((r) => r.method === "GET" && r.path === "/callback");
      expect(callbackRoute).toBeDefined();
    });

    it("registers /library route", () => {
      const routes = controller.router.routes;
      const libraryRoute = routes.find((r) => r.method === "POST" && r.path === "/library");
      expect(libraryRoute).toBeDefined();
    });

    it("registers /sync route", () => {
      const routes = controller.router.routes;
      const syncRoute = routes.find((r) => r.method === "POST" && r.path === "/sync");
      expect(syncRoute).toBeDefined();
    });
  });

  describe("service delegation via route handlers", () => {
    it("delegates getLoginUrl to service via /connect route", async () => {
      const response = await controller.router.request("/connect", {
        headers: { Authorization: "Bearer token" },
      });

      expect(response.status).toBe(200);
      expect(mockService.getLoginUrl).toHaveBeenCalled();

      const data = (await response.json()) as { redirect_url: string };
      expect(data.redirect_url).toContain("steamcommunity.com");
    });

    it("delegates importLibrary to service via /library route", async () => {
      const response = await controller.router.request("/library", {
        method: "POST",
        headers: { Authorization: "Bearer token" },
      });

      expect(response.status).toBe(200);
      expect(mockService.importLibrary).toHaveBeenCalledWith("user-1");

      const data = (await response.json()) as {
        imported: number;
        skipped: number;
        errors: string[];
      };
      expect(data.imported).toBe(0);
      expect(data.skipped).toBe(0);
    });

    it("delegates syncAchievements to service via /sync route", async () => {
      const gameId = "550e8400-e29b-41d4-a716-446655440000";
      const response = await controller.router.request("/sync", {
        method: "POST",
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ game_id: gameId }),
      });

      expect(response.status).toBe(200);
      expect(mockService.syncAchievements).toHaveBeenCalledWith("user-1", gameId);

      const data = (await response.json()) as {
        synced: number;
        unlocked: number;
        total: number;
      };
      expect(data.synced).toBe(0);
      expect(data.unlocked).toBe(0);
      expect(data.total).toBe(0);
    });

    it("delegates validateCallback and linkAccount via /callback route", async () => {
      const params = new URLSearchParams();
      params.set("openid.mode", "id_res");
      params.set("openid.claimed_id", "https://steamcommunity.com/openid/id/76561198012345678");

      const response = await controller.router.request("/callback?" + params.toString(), {
        headers: { Authorization: "Bearer token" },
      });

      expect(response.status).toBe(200);
      expect(mockService.validateCallback).toHaveBeenCalled();
      expect(mockService.linkAccount).toHaveBeenCalledWith("user-1", "76561198012345678");

      const data = (await response.json()) as { status: string; steam_id: string };
      expect(data.status).toBe("linked");
      expect(data.steam_id).toBeDefined();
    });
  });

  describe("authentication", () => {
    it("returns 401 for /connect without auth", async () => {
      const response = await controller.router.request("/connect");
      expect(response.status).toBe(401);
    });

    it("returns 401 for /callback without auth", async () => {
      const response = await controller.router.request("/callback");
      expect(response.status).toBe(401);
    });

    it("returns 401 for /library without auth", async () => {
      const response = await controller.router.request("/library", { method: "POST" });
      expect(response.status).toBe(401);
    });

    it("returns 401 for /sync without auth", async () => {
      const response = await controller.router.request("/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: "550e8400-e29b-41d4-a716-446655440000" }),
      });
      expect(response.status).toBe(401);
    });
  });

  describe("Steam not linked errors", () => {
    it("returns 422 for /library when Steam not linked", async () => {
      // Override mock to throw UnprocessableEntityError
      const unlinkedMockService = createMockSteamService({
        importLibrary: mock().mockRejectedValue(
          new UnprocessableEntityError("Steam account not linked")
        ),
      });
      const unlinkedController = new SteamController(unlinkedMockService, mockLogger, mockConfig);
      unlinkedController.router.onError(createErrorHandler(mockLogger));

      const response = await unlinkedController.router.request("/library", {
        method: "POST",
        headers: { Authorization: "Bearer token" },
      });

      expect(response.status).toBe(422);

      const data = (await response.json()) as { error: string; code: string };
      expect(data.error).toBe("Steam account not linked");
      expect(data.code).toBe("UNPROCESSABLE_ENTITY");
    });

    it("returns 422 for /sync when Steam not linked", async () => {
      // Override mock to throw UnprocessableEntityError
      const unlinkedMockService = createMockSteamService({
        syncAchievements: mock().mockRejectedValue(
          new UnprocessableEntityError("Steam account not linked")
        ),
      });
      const unlinkedController = new SteamController(unlinkedMockService, mockLogger, mockConfig);
      unlinkedController.router.onError(createErrorHandler(mockLogger));

      const response = await unlinkedController.router.request("/sync", {
        method: "POST",
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ game_id: "550e8400-e29b-41d4-a716-446655440000" }),
      });

      expect(response.status).toBe(422);

      const data = (await response.json()) as { error: string; code: string };
      expect(data.error).toBe("Steam account not linked");
      expect(data.code).toBe("UNPROCESSABLE_ENTITY");
    });
  });
});
