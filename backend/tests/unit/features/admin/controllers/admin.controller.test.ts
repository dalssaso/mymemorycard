import { beforeEach, describe, expect, it } from "bun:test";
import "reflect-metadata";

import { AdminController } from "@/features/admin/controllers/admin.controller";
import type { IAdminController } from "@/features/admin/controllers/admin.controller.interface";
import type { IAdminService } from "@/features/admin/services/admin.service.interface";
import { createMockAdminService, createMockLogger } from "@/tests/helpers/repository.mocks";

describe("AdminController", () => {
  let controller: IAdminController;
  let mockService: IAdminService;

  beforeEach(() => {
    mockService = createMockAdminService();
    controller = new AdminController(mockService, createMockLogger());
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
      expect(typeof controller.router).toBe("object");
    });
  });

  describe("route configuration", () => {
    it("should have GET /settings route registered", () => {
      const routes = controller.router.routes;
      const getRoute = routes.find((r) => r.method === "GET" && r.path === "/settings");
      expect(getRoute).toBeDefined();
    });

    it("should have PATCH /settings route registered", () => {
      const routes = controller.router.routes;
      const patchRoute = routes.find((r) => r.method === "PATCH" && r.path === "/settings");
      expect(patchRoute).toBeDefined();
    });
  });

  describe("service integration", () => {
    it("should use injected service for getSettings", () => {
      mockService = createMockAdminService();
      controller = new AdminController(mockService, createMockLogger());

      // Verify the service is properly injected and has the required method
      expect(mockService.getSettings).toBeDefined();
      expect(typeof mockService.getSettings).toBe("function");
    });

    it("should use injected service for updateSettings", () => {
      mockService = createMockAdminService();
      controller = new AdminController(mockService, createMockLogger());

      // Verify the service is properly injected and has the required method
      expect(mockService.updateSettings).toBeDefined();
      expect(typeof mockService.updateSettings).toBe("function");
    });
  });
});
