import { describe, it, expect } from "bun:test"
import "reflect-metadata"

import {
  mapIgdbGameToSearchResult,
  mapIgdbGameToGameDetails,
  mapIgdbPlatformToPlatform,
  extractStoresFromWebsites,
} from "@/integrations/igdb/igdb.mapper"
import type { IgdbGame, IgdbPlatform, IgdbWebsite } from "@/integrations/igdb/igdb.types"

describe("IGDB Mappers", () => {
  describe("mapIgdbGameToSearchResult", () => {
    it("should map basic game fields", () => {
      const igdbGame: IgdbGame = {
        id: 12345,
        name: "Test Game",
        slug: "test-game",
      }

      const result = mapIgdbGameToSearchResult(igdbGame)

      expect(result.igdb_id).toBe(12345)
      expect(result.name).toBe("Test Game")
      expect(result.cover_url).toBeNull()
    })

    it("should build cover URL from cover image_id", () => {
      const igdbGame: IgdbGame = {
        id: 12345,
        name: "Test Game",
        slug: "test-game",
        cover: { id: 1, image_id: "co1abc" },
      }

      const result = mapIgdbGameToSearchResult(igdbGame)

      expect(result.cover_url).toBe(
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co1abc.jpg"
      )
    })

    it("should map platforms", () => {
      const igdbGame: IgdbGame = {
        id: 12345,
        name: "Test Game",
        slug: "test-game",
        platforms: [
          { id: 6, name: "PC (Microsoft Windows)", abbreviation: "PC" },
          { id: 48, name: "PlayStation 4", abbreviation: "PS4" },
        ],
      }

      const result = mapIgdbGameToSearchResult(igdbGame)

      expect(result.platforms).toHaveLength(2)
      expect(result.platforms[0]).toEqual({
        igdb_platform_id: 6,
        name: "PC (Microsoft Windows)",
        abbreviation: "PC",
      })
    })

    it("should map franchise name", () => {
      const igdbGame: IgdbGame = {
        id: 12345,
        name: "Test Game",
        slug: "test-game",
        franchises: [{ id: 1, name: "Test Series" }],
      }

      const result = mapIgdbGameToSearchResult(igdbGame)

      expect(result.franchise).toBe("Test Series")
    })

    it("should return null franchise when empty", () => {
      const igdbGame: IgdbGame = {
        id: 12345,
        name: "Test Game",
        slug: "test-game",
        franchises: [],
      }

      const result = mapIgdbGameToSearchResult(igdbGame)

      expect(result.franchise).toBeNull()
    })
  })

  describe("mapIgdbGameToGameDetails", () => {
    it("should map all game details fields", () => {
      const igdbGame: IgdbGame = {
        id: 12345,
        name: "Test Game",
        slug: "test-game",
        summary: "A test game",
        first_release_date: 1609459200, // 2021-01-01
        aggregated_rating: 85.5,
        genres: [{ id: 1, name: "Action", slug: "action" }],
      }

      const result = mapIgdbGameToGameDetails(igdbGame)

      expect(result.igdb_id).toBe(12345)
      expect(result.name).toBe("Test Game")
      expect(result.summary).toBe("A test game")
      expect(result.release_date).toBe("2021-01-01")
      expect(result.rating).toBe(85.5)
      expect(result.genres).toEqual(["Action"])
    })

    it("should handle missing optional fields", () => {
      const igdbGame: IgdbGame = {
        id: 12345,
        name: "Test Game",
        slug: "test-game",
      }

      const result = mapIgdbGameToGameDetails(igdbGame)

      expect(result.summary).toBeNull()
      expect(result.release_date).toBeNull()
      expect(result.rating).toBeNull()
      expect(result.genres).toEqual([])
    })
  })

  describe("mapIgdbPlatformToPlatform", () => {
    it("should map platform fields", () => {
      const igdbPlatform: IgdbPlatform = {
        id: 6,
        name: "PC (Microsoft Windows)",
        abbreviation: "PC",
        slug: "win",
        platform_family: { id: 1, name: "PC" },
      }

      const result = mapIgdbPlatformToPlatform(igdbPlatform)

      expect(result.igdb_platform_id).toBe(6)
      expect(result.name).toBe("PC (Microsoft Windows)")
      expect(result.abbreviation).toBe("PC")
      expect(result.slug).toBe("win")
      expect(result.platform_family).toBe("PC")
    })

    it("should handle missing platform family", () => {
      const igdbPlatform: IgdbPlatform = {
        id: 48,
        name: "PlayStation 4",
        abbreviation: "PS4",
        slug: "ps4",
      }

      const result = mapIgdbPlatformToPlatform(igdbPlatform)

      expect(result.platform_family).toBeNull()
    })
  })

  describe("extractStoresFromWebsites", () => {
    it("should extract known store URLs", () => {
      const websites: IgdbWebsite[] = [
        { id: 1, category: 13, url: "https://store.steampowered.com/app/123" },
        { id: 2, category: 17, url: "https://www.gog.com/game/test" },
        { id: 3, category: 1, url: "https://testgame.com" }, // Official site
      ]

      const result = extractStoresFromWebsites(websites)

      expect(result).toHaveLength(2)
      expect(result).toContainEqual({ slug: "steam", url: "https://store.steampowered.com/app/123" })
      expect(result).toContainEqual({ slug: "gog", url: "https://www.gog.com/game/test" })
    })

    it("should return empty array for no websites", () => {
      const result = extractStoresFromWebsites([])
      expect(result).toEqual([])
    })

    it("should return empty array for undefined", () => {
      const result = extractStoresFromWebsites(undefined)
      expect(result).toEqual([])
    })
  })
})
