import { beforeEach, describe, expect, it } from "bun:test"
import "reflect-metadata"
import { StoreService } from "@/features/stores/services/store.service"
import type { IStoreRepository } from "@/features/games/repositories/store.repository.interface"
import { NotFoundError } from "@/shared/errors/base"
import { createMockLogger } from "@/tests/helpers/repository.mocks"

describe("StoreService", () => {
  let service: StoreService
  let repo: IStoreRepository

  beforeEach(() => {
    repo = {
      findById: async () => ({
        id: "550e8400-e29b-41d4-a716-446655440000",
        slug: "steam",
        display_name: "Steam",
        store_type: "digital" as const,
        platform_family: "PC",
        color_primary: "#171A21",
        website_url: "https://store.steampowered.com",
        icon_url: null,
        supports_achievements: true,
        supports_library_sync: true,
        igdb_website_category: 1,
        sort_order: 1,
        created_at: new Date(),
      }),
      findBySlug: async () => null,
      list: async () => [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          slug: "steam",
          display_name: "Steam",
          store_type: "digital" as const,
          platform_family: "PC",
          color_primary: "#171A21",
          website_url: "https://store.steampowered.com",
          icon_url: null,
          supports_achievements: true,
          supports_library_sync: true,
          igdb_website_category: 1,
          sort_order: 1,
          created_at: new Date(),
        },
      ],
      listByPlatformFamily: async () => [],
      listWithAchievements: async () => [],
    }

    service = new StoreService(repo, createMockLogger())
  })

  it("maps list results to snake_case DTOs", async () => {
    const result = await service.list()

    expect(result.stores[0]).toMatchObject({
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
      created_at: expect.any(String),
    })
  })

  it("maps getById result to snake_case DTO", async () => {
    const result = await service.getById("550e8400-e29b-41d4-a716-446655440000")

    expect(result.store).toMatchObject({
      id: "550e8400-e29b-41d4-a716-446655440000",
      slug: "steam",
      display_name: "Steam",
      store_type: "digital",
      platform_family: "PC",
      color_primary: "#171A21",
      created_at: expect.any(String),
    })
  })

  it("throws NotFoundError when store is missing", async () => {
    repo.findById = async () => null

    await expect(service.getById("missing")).rejects.toThrow(NotFoundError)
  })
})
