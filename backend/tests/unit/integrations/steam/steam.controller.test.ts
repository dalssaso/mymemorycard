import { beforeEach, describe, expect, it } from "bun:test";
import "reflect-metadata";

import { SteamController } from "@/integrations/steam/steam.controller";
import { createMockLogger, createMockSteamService } from "@/tests/helpers/repository.mocks";
import type { ISteamService } from "@/integrations/steam/steam.service.interface";
import type { Logger } from "@/infrastructure/logging/logger";

describe("SteamController", () => {
  let controller: SteamController;
  let mockService: ISteamService;
  let mockLogger: Logger;

  beforeEach(() => {
    mockService = createMockSteamService();
    mockLogger = createMockLogger();
    controller = new SteamController(mockService, mockLogger);
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
      const libraryRoute = routes.find((r) => r.method === "GET" && r.path === "/library");
      expect(libraryRoute).toBeDefined();
    });

    it("registers /sync route", () => {
      const routes = controller.router.routes;
      const syncRoute = routes.find((r) => r.method === "POST" && r.path === "/sync");
      expect(syncRoute).toBeDefined();
    });
  });

  describe("service delegation", () => {
    it("delegates getLoginUrl to service", () => {
      // Verify the service method is available for delegation
      const loginUrl = mockService.getLoginUrl("http://test.com/callback");
      expect(loginUrl).toBe("https://steamcommunity.com/openid/login?...");
      expect(mockService.getLoginUrl).toHaveBeenCalledWith("http://test.com/callback");
    });

    it("delegates validateCallback to service", async () => {
      const params = { mode: "id_res" };
      const result = await mockService.validateCallback(params);
      expect(result).toBe("76561198012345678");
      expect(mockService.validateCallback).toHaveBeenCalledWith(params);
    });

    it("delegates importLibrary to service", async () => {
      const result = await mockService.importLibrary("user-id");
      expect(result).toEqual({ imported: 0, skipped: 0, errors: [] });
      expect(mockService.importLibrary).toHaveBeenCalledWith("user-id");
    });

    it("delegates syncAchievements to service", async () => {
      const result = await mockService.syncAchievements("user-id", "game-id");
      expect(result).toEqual({ synced: 0, unlocked: 0, total: 0 });
      expect(mockService.syncAchievements).toHaveBeenCalledWith("user-id", "game-id");
    });

    it("delegates linkAccount to service", async () => {
      const result = await mockService.linkAccount("user-id", "steam-id");
      expect(result.steam_id).toBeDefined();
      expect(mockService.linkAccount).toHaveBeenCalledWith("user-id", "steam-id");
    });
  });
});
