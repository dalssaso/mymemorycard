import { describe, it, expect } from "vitest";

import { adaptStore, adaptStoreListResponse } from "../stores";

describe("Store Adapters", () => {
  describe("adaptStore", () => {
    it("should transform SDK Store to frontend Store", () => {
      const sdkStore = {
        id: "store-1",
        slug: "steam",
        display_name: "Steam",
        store_type: "digital" as const,
        platform_family: "PC",
        color_primary: "#1b2838",
        website_url: "https://store.steampowered.com",
        icon_url: "https://example.com/steam.png",
        supports_achievements: true,
        supports_library_sync: true,
        igdb_website_category: 13,
        sort_order: 1,
        created_at: "2026-01-01T00:00:00Z",
      };

      const result = adaptStore(sdkStore);

      expect(result).toEqual({
        id: "store-1",
        name: "Steam",
        slug: "steam",
        display_name: "Steam",
        platform_family: "PC",
        icon_url: "https://example.com/steam.png",
      });
    });

    it("should handle null platform_family and icon_url", () => {
      const sdkStore = {
        id: "store-2",
        slug: "gog",
        display_name: "GOG.com",
        store_type: "digital" as const,
        platform_family: null,
        color_primary: "#86328a",
        website_url: null,
        icon_url: null,
        supports_achievements: false,
        supports_library_sync: false,
        igdb_website_category: 17,
        sort_order: 2,
        created_at: null,
      };

      const result = adaptStore(sdkStore);

      expect(result.platform_family).toBeNull();
      expect(result.icon_url).toBeNull();
    });
  });

  describe("adaptStoreListResponse", () => {
    it("should transform SDK store list response", () => {
      const sdkResponse = {
        stores: [
          {
            id: "store-1",
            slug: "steam",
            display_name: "Steam",
            store_type: "digital" as const,
            platform_family: "PC",
            color_primary: "#1b2838",
            website_url: "https://store.steampowered.com",
            icon_url: "https://example.com/steam.png",
            supports_achievements: true,
            supports_library_sync: true,
            igdb_website_category: 13,
            sort_order: 1,
            created_at: "2026-01-01T00:00:00Z",
          },
        ],
      };

      const result = adaptStoreListResponse(sdkResponse);

      expect(result.stores).toHaveLength(1);
      expect(result.stores[0]).toEqual({
        id: "store-1",
        name: "Steam",
        slug: "steam",
        display_name: "Steam",
        platform_family: "PC",
        icon_url: "https://example.com/steam.png",
      });
    });

    it("should handle empty stores array", () => {
      const sdkResponse = { stores: [] };

      const result = adaptStoreListResponse(sdkResponse);

      expect(result.stores).toEqual([]);
    });
  });
});
