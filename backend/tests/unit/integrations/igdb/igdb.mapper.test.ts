import { describe, it, expect } from "bun:test";
import "reflect-metadata";

import {
  mapIgdbGameToSearchResult,
  mapIgdbGameToGameDetails,
  mapIgdbPlatformToPlatform,
  extractStoresFromWebsites,
} from "@/integrations/igdb/igdb.mapper";
import type { IgdbWebsite } from "@/integrations/igdb/igdb.types";
import {
  IGDB_GAME_FIXTURE,
  IGDB_PLATFORM_FIXTURE,
  createIgdbGameFixture,
  createIgdbPlatformFixture,
} from "@/tests/helpers/igdb.fixtures";

describe("IGDB Mappers", () => {
  describe("mapIgdbGameToSearchResult", () => {
    it("should map basic game fields", () => {
      const igdbGame = createIgdbGameFixture({
        cover: undefined,
        platforms: undefined,
        franchises: undefined,
      });

      const result = mapIgdbGameToSearchResult(igdbGame);

      expect(result.igdb_id).toBe(igdbGame.id);
      expect(result.name).toBe(igdbGame.name);
      expect(result.cover_url).toBeNull();
    });

    it("should build cover URL from cover image_id", () => {
      const result = mapIgdbGameToSearchResult(IGDB_GAME_FIXTURE);

      expect(result.cover_url).toBe(
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg"
      );
    });

    it("should map platforms", () => {
      const result = mapIgdbGameToSearchResult(IGDB_GAME_FIXTURE);

      expect(result.platforms).toHaveLength(3);
      expect(result.platforms[0]).toEqual({
        igdb_platform_id: 6,
        name: "PC (Microsoft Windows)",
        abbreviation: "PC",
      });
    });

    it("should map franchise name", () => {
      const result = mapIgdbGameToSearchResult(IGDB_GAME_FIXTURE);

      expect(result.franchise).toBe("The Witcher");
    });

    it("should return null franchise when empty", () => {
      const igdbGame = createIgdbGameFixture({ franchises: [] });

      const result = mapIgdbGameToSearchResult(igdbGame);

      expect(result.franchise).toBeNull();
    });
  });

  describe("mapIgdbGameToGameDetails", () => {
    it("should map all game details fields", () => {
      const result = mapIgdbGameToGameDetails(IGDB_GAME_FIXTURE);

      expect(result.igdb_id).toBe(IGDB_GAME_FIXTURE.id);
      expect(result.name).toBe(IGDB_GAME_FIXTURE.name);
      expect(result.summary).toBe(IGDB_GAME_FIXTURE.summary!);
      expect(result.release_date).toBe("2015-05-19");
      expect(result.rating).toBe(IGDB_GAME_FIXTURE.aggregated_rating!);
      expect(result.genres).toContain("Role-playing (RPG)");
      expect(result.genres).toContain("Adventure");
    });

    it("should handle missing optional fields", () => {
      const igdbGame = createIgdbGameFixture({
        summary: undefined,
        first_release_date: undefined,
        aggregated_rating: undefined,
        genres: undefined,
      });

      const result = mapIgdbGameToGameDetails(igdbGame);

      expect(result.summary).toBeNull();
      expect(result.release_date).toBeNull();
      expect(result.rating).toBeNull();
      expect(result.genres).toEqual([]);
    });
  });

  describe("mapIgdbPlatformToPlatform", () => {
    it("should map platform fields", () => {
      const result = mapIgdbPlatformToPlatform(IGDB_PLATFORM_FIXTURE);

      expect(result.igdb_platform_id).toBe(IGDB_PLATFORM_FIXTURE.id);
      expect(result.name).toBe(IGDB_PLATFORM_FIXTURE.name);
      expect(result.abbreviation).toBe(IGDB_PLATFORM_FIXTURE.abbreviation!);
      expect(result.slug).toBe(IGDB_PLATFORM_FIXTURE.slug);
      expect(result.platform_family).toBe("PC");
    });

    it("should handle missing platform family", () => {
      const igdbPlatform = createIgdbPlatformFixture({
        id: 48,
        name: "PlayStation 4",
        abbreviation: "PS4",
        slug: "ps4",
        platform_family: undefined,
      });

      const result = mapIgdbPlatformToPlatform(igdbPlatform);

      expect(result.platform_family).toBeNull();
    });
  });

  describe("extractStoresFromWebsites", () => {
    it("should extract known store URLs", () => {
      // Use websites from the game fixture
      const result = extractStoresFromWebsites(IGDB_GAME_FIXTURE.websites);

      expect(result.length).toBeGreaterThan(0);
      expect(result).toContainEqual({
        slug: "steam",
        url: "https://store.steampowered.com/app/292030",
      });
      expect(result).toContainEqual({
        slug: "gog",
        url: "https://www.gog.com/game/the_witcher_3_wild_hunt",
      });
    });

    it("should extract only store URLs, not official sites", () => {
      const websites: IgdbWebsite[] = [
        { id: 1, category: 13, url: "https://store.steampowered.com/app/123" },
        { id: 2, category: 1, url: "https://testgame.com" }, // Official site (category 1)
      ];

      const result = extractStoresFromWebsites(websites);

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("steam");
    });

    it("should return empty array for no websites", () => {
      const result = extractStoresFromWebsites([]);
      expect(result).toEqual([]);
    });

    it("should return empty array for undefined", () => {
      const result = extractStoresFromWebsites(undefined);
      expect(result).toEqual([]);
    });
  });
});
