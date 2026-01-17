import { beforeEach, describe, expect, it, mock } from "bun:test";
import "reflect-metadata";

import { CredentialController } from "@/features/credentials/controllers/credential.controller";
import type { ICredentialService } from "@/features/credentials/services/credential.service.interface";
import { createMockLogger } from "@/tests/helpers/repository.mocks";

const createMockCredentialService = (): ICredentialService => ({
  listCredentials: mock().mockResolvedValue({ services: [] }),
  saveCredentials: mock().mockResolvedValue({
    service: "igdb",
    credential_type: "twitch_oauth",
    is_active: true,
    message: "Credentials saved",
  }),
  validateCredentials: mock().mockResolvedValue({
    service: "igdb",
    valid: true,
    has_valid_token: true,
    token_expires_at: null,
    message: "Validated",
  }),
  deleteCredentials: mock().mockResolvedValue(undefined),
});

describe("CredentialController", () => {
  let controller: CredentialController;
  let mockService: ReturnType<typeof createMockCredentialService>;

  beforeEach(() => {
    mockService = createMockCredentialService();
    controller = new CredentialController(mockService, createMockLogger());
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

  describe("route registration", () => {
    it("should register all required routes", () => {
      const routes = controller.router.routes.map(
        (r: { method: string; path: string }) => `${r.method} ${r.path}`
      );

      expect(routes).toContain("GET /");
      expect(routes).toContain("POST /");
      expect(routes).toContain("POST /validate");
      expect(routes).toContain("DELETE /:service");
    });
  });
});
