import { beforeEach, describe, expect, it } from "bun:test"
import "reflect-metadata"

import { AdminController } from "@/features/admin/controllers/admin.controller"
import type { IAdminController } from "@/features/admin/controllers/admin.controller.interface"
import type { IAdminService } from "@/features/admin/services/admin.service.interface"
import { createMockLogger } from "@/tests/helpers/repository.mocks"

const createMockService = (): IAdminService => ({
  getSettings: async () => ({
    analytics: {
      enabled: false,
      provider: null,
      key: null,
      host: null,
    },
    search: {
      server_side: true,
      debounce_ms: 300,
    },
  }),
  updateSettings: async () => ({
    analytics: {
      enabled: false,
      provider: null,
      key: null,
      host: null,
    },
    search: {
      server_side: true,
      debounce_ms: 300,
    },
  }),
})

describe("AdminController", () => {
  let controller: IAdminController
  let mockService: IAdminService

  beforeEach(() => {
    mockService = createMockService()
    controller = new AdminController(mockService, createMockLogger())
  })

  describe("initialization", () => {
    it("should create controller instance", () => {
      expect(controller).toBeDefined()
    })

    it("should have router property", () => {
      expect(controller.router).toBeDefined()
    })

    it("should have OpenAPIHono router with correct type", () => {
      expect(controller.router).toBeDefined()
      // OpenAPIHono instances have routes map
      expect(typeof controller.router).toBe("object")
    })
  })
})
