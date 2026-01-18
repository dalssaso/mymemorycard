import { describe, it, expect } from "vitest";
import type { Game, GameSearchResult, GameImportPayload } from "../games";

describe("Game Types", () => {
  describe("Game type", () => {
    it("should have required IGDB fields", () => {
      const game: Game = {
        id: "game-1",
        igdb_id: 12345,
        name: "Test Game",
        cover_art_url: "/uploads/covers/game-1.jpg",
        platform_id: "platform-1",
        store_id: "store-1",
        metadata_source: "igdb",
        status: "playing",
        rating: 8.5,
        is_favorite: true,
        created_at: new Date().toISOString(),
      };

      expect(game.igdb_id).toBeDefined();
      expect(game.cover_art_url).toBeDefined();
      expect(game.platform_id).toBeDefined();
      expect(game.store_id).toBeDefined();
      expect(game.metadata_source).toBe("igdb");
    });
  });

  describe("GameSearchResult type", () => {
    it("should have IGDB search fields", () => {
      const result: GameSearchResult = {
        igdb_id: 12345,
        name: "Test Game",
        cover_art_url: "https://images.igdb.com/...",
        release_date: "2023-01-15",
        platforms: [
          {
            igdb_platform_id: 6,
            name: "PC (Windows)",
          },
        ],
        franchise: "Test Series",
        stores: [
          {
            slug: "steam",
            display_name: "Steam",
          },
        ],
      };

      expect(result.igdb_id).toBeDefined();
      expect(result.platforms).toBeDefined();
      expect(result.stores).toBeDefined();
    });
  });

  describe("GameImportPayload type", () => {
    it("should require igdb_id with optional platform_id and store_id", () => {
      // GameImportPayload is now an alias for ImportGameRequest
      const payload: GameImportPayload = {
        igdb_id: 12345,
        platform_id: "platform-1",
        store_id: "store-1",
      };

      expect(payload.igdb_id).toBeDefined();
      expect(payload.platform_id).toBeDefined();
      expect(payload.store_id).toBeDefined();
    });

    it("should allow omitting optional fields", () => {
      const minimalPayload: GameImportPayload = {
        igdb_id: 12345,
      };

      expect(minimalPayload.igdb_id).toBe(12345);
      expect(minimalPayload.platform_id).toBeUndefined();
    });
  });
});
