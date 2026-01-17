import { beforeEach, describe, expect, it } from "bun:test";
import "reflect-metadata";

import { StoreRepository } from "@/features/games/repositories/store.repository";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import { createMockDrizzleDB } from "@/tests/helpers/drizzle.mocks";

describe("StoreRepository", () => {
  let repository: StoreRepository;
  let mockDb: DrizzleDB;

  beforeEach(() => {
    mockDb = createMockDrizzleDB();
    repository = new StoreRepository(mockDb);
  });

  describe("findById", () => {
    it("returns null when store not found", async () => {
      const mockQuery = {
        stores: {
          findFirst: async () => null,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findById("non-existent-id");

      expect(result).toBeNull();
    });

    it("returns store when found by id", async () => {
      const storeRow = {
        id: "store-steam",
        slug: "steam",
        displayName: "Steam",
        storeType: "digital" as const,
        platformFamily: "pc",
        colorPrimary: "#1b2838",
        websiteUrl: "https://steampowered.com",
        iconUrl: "https://example.com/steam-icon.png",
        supportsAchievements: true,
        supportsLibrarySync: true,
        igdbWebsiteCategory: 1,
        sortOrder: 1,
        createdAt: new Date("2024-01-01"),
      };

      const mockQuery = {
        stores: {
          findFirst: async () => storeRow,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findById("store-steam");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("store-steam");
      expect(result?.slug).toBe("steam");
      expect(result?.display_name).toBe("Steam");
      expect(result?.supports_achievements).toBe(true);
    });
  });

  describe("findBySlug", () => {
    it("returns null when store not found by slug", async () => {
      const mockQuery = {
        stores: {
          findFirst: async () => null,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findBySlug("non-existent-store");

      expect(result).toBeNull();
    });

    it("returns store when found by slug", async () => {
      const storeRow = {
        id: "store-gog",
        slug: "gog",
        displayName: "GOG",
        storeType: "digital" as const,
        platformFamily: "pc",
        colorPrimary: "#86328f",
        websiteUrl: "https://gog.com",
        iconUrl: "https://example.com/gog-icon.png",
        supportsAchievements: false,
        supportsLibrarySync: false,
        igdbWebsiteCategory: 11,
        sortOrder: 2,
        createdAt: new Date("2024-01-01"),
      };

      const mockQuery = {
        stores: {
          findFirst: async () => storeRow,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findBySlug("gog");

      expect(result).not.toBeNull();
      expect(result?.slug).toBe("gog");
      expect(result?.display_name).toBe("GOG");
    });

    it("returns epic games store by slug", async () => {
      const storeRow = {
        id: "store-epic",
        slug: "epic",
        displayName: "Epic Games Store",
        storeType: "digital" as const,
        platformFamily: "pc",
        colorPrimary: "#313131",
        websiteUrl: "https://epicgames.com",
        iconUrl: "https://example.com/epic-icon.png",
        supportsAchievements: false,
        supportsLibrarySync: true,
        igdbWebsiteCategory: 26,
        sortOrder: 3,
        createdAt: new Date("2024-01-01"),
      };

      const mockQuery = {
        stores: {
          findFirst: async () => storeRow,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findBySlug("epic");

      expect(result?.slug).toBe("epic");
      expect(result?.supports_library_sync).toBe(true);
    });
  });

  describe("list", () => {
    it("lists all stores", async () => {
      const stores = [
        {
          id: "store-1",
          slug: "steam",
          displayName: "Steam",
          storeType: "digital" as const,
          platformFamily: "pc",
          colorPrimary: "#1b2838",
          websiteUrl: "https://steampowered.com",
          iconUrl: null,
          supportsAchievements: true,
          supportsLibrarySync: true,
          igdbWebsiteCategory: 1,
          sortOrder: 1,
          createdAt: new Date(),
        },
        {
          id: "store-2",
          slug: "gog",
          displayName: "GOG",
          storeType: "digital" as const,
          platformFamily: "pc",
          colorPrimary: "#86328f",
          websiteUrl: "https://gog.com",
          iconUrl: null,
          supportsAchievements: false,
          supportsLibrarySync: false,
          igdbWebsiteCategory: 11,
          sortOrder: 2,
          createdAt: new Date(),
        },
        {
          id: "store-3",
          slug: "playstation-store",
          displayName: "PlayStation Store",
          storeType: "digital" as const,
          platformFamily: "PS",
          colorPrimary: "#003087",
          websiteUrl: "https://store.playstation.com",
          iconUrl: null,
          supportsAchievements: true,
          supportsLibrarySync: false,
          igdbWebsiteCategory: 2,
          sortOrder: 4,
          createdAt: new Date(),
        },
      ];

      const mockQuery = {
        stores: {
          findMany: async () => stores,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.list();

      expect(result).toHaveLength(3);
      expect(result[0].slug).toBe("steam");
      expect(result[1].slug).toBe("gog");
      expect(result[2].slug).toBe("playstation-store");
    });

    it("returns empty array when no stores exist", async () => {
      const mockQuery = {
        stores: {
          findMany: async () => [],
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.list();

      expect(result).toHaveLength(0);
    });
  });

  describe("listByPlatformFamily", () => {
    it("returns stores for specific platform family", async () => {
      const pcStores = [
        {
          id: "store-steam",
          slug: "steam",
          displayName: "Steam",
          storeType: "digital" as const,
          platformFamily: "pc",
          colorPrimary: "#1b2838",
          websiteUrl: "https://steampowered.com",
          iconUrl: null,
          supportsAchievements: true,
          supportsLibrarySync: true,
          igdbWebsiteCategory: 1,
          sortOrder: 1,
          createdAt: new Date(),
        },
        {
          id: "store-gog",
          slug: "gog",
          displayName: "GOG",
          storeType: "digital" as const,
          platformFamily: "pc",
          colorPrimary: "#86328f",
          websiteUrl: "https://gog.com",
          iconUrl: null,
          supportsAchievements: false,
          supportsLibrarySync: false,
          igdbWebsiteCategory: 11,
          sortOrder: 2,
          createdAt: new Date(),
        },
        {
          id: "store-epic",
          slug: "epic",
          displayName: "Epic Games Store",
          storeType: "digital" as const,
          platformFamily: "pc",
          colorPrimary: "#313131",
          websiteUrl: "https://epicgames.com",
          iconUrl: null,
          supportsAchievements: false,
          supportsLibrarySync: true,
          igdbWebsiteCategory: 26,
          sortOrder: 3,
          createdAt: new Date(),
        },
      ];

      const mockQuery = {
        stores: {
          findMany: async () => pcStores,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.listByPlatformFamily("pc");

      expect(result).toHaveLength(3);
      expect(result.every((s) => s.platform_family === "pc")).toBe(true);
      expect(result[0].slug).toBe("steam");
    });

    it("returns playstation stores by platform family", async () => {
      const psStores = [
        {
          id: "store-ps",
          slug: "playstation-store",
          displayName: "PlayStation Store",
          storeType: "digital" as const,
          platformFamily: "PS",
          colorPrimary: "#003087",
          websiteUrl: "https://store.playstation.com",
          iconUrl: null,
          supportsAchievements: true,
          supportsLibrarySync: false,
          igdbWebsiteCategory: 2,
          sortOrder: 4,
          createdAt: new Date(),
        },
      ];

      const mockQuery = {
        stores: {
          findMany: async () => psStores,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.listByPlatformFamily("PS");

      expect(result).toHaveLength(1);
      expect(result[0].platform_family).toBe("PS");
    });

    it("returns empty array for platform family with no stores", async () => {
      const mockQuery = {
        stores: {
          findMany: async () => [],
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.listByPlatformFamily("nonexistent");

      expect(result).toHaveLength(0);
    });

    it("returns xbox stores by platform family", async () => {
      const xboxStores = [
        {
          id: "store-xbox",
          slug: "xbox-store",
          displayName: "Xbox Store",
          storeType: "digital" as const,
          platformFamily: "Xbox",
          colorPrimary: "#107c10",
          websiteUrl: "https://xbox.com",
          iconUrl: null,
          supportsAchievements: true,
          supportsLibrarySync: true,
          igdbWebsiteCategory: 3,
          sortOrder: 5,
          createdAt: new Date(),
        },
      ];

      const mockQuery = {
        stores: {
          findMany: async () => xboxStores,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.listByPlatformFamily("Xbox");

      expect(result).toHaveLength(1);
      expect(result[0].platform_family).toBe("Xbox");
    });
  });

  describe("listWithAchievements", () => {
    it("returns only stores supporting achievements", async () => {
      const achievementStores = [
        {
          id: "store-steam",
          slug: "steam",
          displayName: "Steam",
          storeType: "digital" as const,
          platformFamily: "pc",
          colorPrimary: "#1b2838",
          websiteUrl: "https://steampowered.com",
          iconUrl: null,
          supportsAchievements: true,
          supportsLibrarySync: true,
          igdbWebsiteCategory: 1,
          sortOrder: 1,
          createdAt: new Date(),
        },
        {
          id: "store-xbox",
          slug: "xbox-store",
          displayName: "Xbox Store",
          storeType: "digital" as const,
          platformFamily: "Xbox",
          colorPrimary: "#107c10",
          websiteUrl: "https://xbox.com",
          iconUrl: null,
          supportsAchievements: true,
          supportsLibrarySync: true,
          igdbWebsiteCategory: 3,
          sortOrder: 5,
          createdAt: new Date(),
        },
        {
          id: "store-ps",
          slug: "playstation-store",
          displayName: "PlayStation Store",
          storeType: "digital" as const,
          platformFamily: "PS",
          colorPrimary: "#003087",
          websiteUrl: "https://store.playstation.com",
          iconUrl: null,
          supportsAchievements: true,
          supportsLibrarySync: false,
          igdbWebsiteCategory: 2,
          sortOrder: 4,
          createdAt: new Date(),
        },
      ];

      const mockQuery = {
        stores: {
          findMany: async () => achievementStores,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.listWithAchievements();

      expect(result).toHaveLength(3);
      expect(result.every((s) => s.supports_achievements)).toBe(true);
    });

    it("returns empty array when no stores support achievements", async () => {
      const mockQuery = {
        stores: {
          findMany: async () => [],
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.listWithAchievements();

      expect(result).toHaveLength(0);
    });

    it("excludes stores without achievement support", async () => {
      const mockQuery = {
        stores: {
          findMany: async () => [],
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.listWithAchievements();

      expect(result.some((s) => s.slug === "gog")).toBe(false);
      expect(result.every((s) => s.supports_achievements)).toBe(true);
    });

    it("includes only stores with true achievement support", async () => {
      const storesWithAchievements = [
        {
          id: "store-steam",
          slug: "steam",
          displayName: "Steam",
          storeType: "digital" as const,
          platformFamily: "pc",
          colorPrimary: "#1b2838",
          websiteUrl: "https://steampowered.com",
          iconUrl: null,
          supportsAchievements: true,
          supportsLibrarySync: true,
          igdbWebsiteCategory: 1,
          sortOrder: 1,
          createdAt: new Date(),
        },
      ];

      const mockQuery = {
        stores: {
          findMany: async () => storesWithAchievements,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.listWithAchievements();

      expect(result).toHaveLength(1);
      expect(result[0].supports_achievements).toBe(true);
    });
  });
});
