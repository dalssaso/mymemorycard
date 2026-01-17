import { beforeEach, describe, expect, it, mock } from "bun:test"
import "reflect-metadata"

import { StoreController } from "@/features/stores/controllers/store.controller"
import type { IStoreService } from "@/features/stores/services/store.service.interface"
import { createMockLogger } from "@/tests/helpers/repository.mocks"

describe("StoreController", () => {
  let controller: StoreController
  let mockService: IStoreService

  beforeEach(() => {
    mockService = {
      list: mock().mockResolvedValue({
        stores: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            slug: "steam",
            display_name: "Steam",
            store_type: "digital",
            platform_family: "PC",
            color_primary: "#171A21",
            website_url: "https://store.steampowered.com",
            icon_url: null,
            supports_achievements: true,
            supports_library_sync: true,
            igdb_website_category: 1,
            sort_order: 1,
            created_at: "2024-01-01T00:00:00.000Z",
          },
        ],
      }),
      getById: mock().mockResolvedValue({
        store: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          slug: "steam",
          display_name: "Steam",
          store_type: "digital",
          platform_family: "PC",
          color_primary: "#171A21",
          website_url: "https://store.steampowered.com",
          icon_url: null,
          supports_achievements: true,
          supports_library_sync: true,
          igdb_website_category: 1,
          sort_order: 1,
          created_at: "2024-01-01T00:00:00.000Z",
        },
      }),
    }

    controller = new StoreController(mockService, createMockLogger())
  })

  it("creates router with registered routes", () => {
    expect(controller.router).toBeDefined()
  })

  it("has list route registered", () => {
    const routes = controller.router.routes
    const listRoute = routes.find((r) => r.method === "GET" && r.path === "/")
    expect(listRoute).toBeDefined()
  })

  it("has get by id route registered", () => {
    const routes = controller.router.routes
    const getRoute = routes.find((r) => r.method === "GET" && r.path === "/:id")
    expect(getRoute).toBeDefined()
  })
})
