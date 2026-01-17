import { beforeEach, describe, expect, it } from "bun:test";
import "reflect-metadata";

import { PlatformRepository } from "@/features/games/repositories/platform.repository";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import {
  createMockDrizzleDB,
  mockInsertResult,
  mockTransaction,
} from "@/tests/helpers/drizzle.mocks";

describe("PlatformRepository", () => {
  let repository: PlatformRepository;
  let mockDb: DrizzleDB;

  beforeEach(() => {
    mockDb = createMockDrizzleDB();
    repository = new PlatformRepository(mockDb);
  });

  describe("findById", () => {
    it("returns null when platform not found", async () => {
      const mockQuery = {
        platforms: {
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

    it("returns platform when found by id", async () => {
      const platformRow = {
        id: "platform-123",
        igdbPlatformId: 6,
        name: "PC (Windows)",
        abbreviation: "PC",
        slug: "pc",
        platformFamily: "pc",
        colorPrimary: "#3498db",
        createdAt: new Date("2024-01-01"),
      };

      const mockQuery = {
        platforms: {
          findFirst: async () => platformRow,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findById("platform-123");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("platform-123");
      expect(result?.name).toBe("PC (Windows)");
      expect(result?.igdb_platform_id).toBe(6);
    });
  });

  describe("findByIgdbId", () => {
    it("returns null when platform not found by igdb_id", async () => {
      const mockQuery = {
        platforms: {
          findFirst: async () => null,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findByIgdbId(9999);

      expect(result).toBeNull();
    });

    it("returns platform when found by igdb_id", async () => {
      const platformRow = {
        id: "platform-ps5",
        igdbPlatformId: 167,
        name: "PlayStation 5",
        abbreviation: "PS5",
        slug: "ps5",
        platformFamily: "PS",
        colorPrimary: "#003087",
        createdAt: new Date("2024-01-01"),
      };

      const mockQuery = {
        platforms: {
          findFirst: async () => platformRow,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findByIgdbId(167);

      expect(result).not.toBeNull();
      expect(result?.igdb_platform_id).toBe(167);
      expect(result?.name).toBe("PlayStation 5");
      expect(result?.platform_family).toBe("PS");
    });
  });

  describe("getOrCreate", () => {
    it("returns existing platform when found by igdb_id", async () => {
      const existingPlatform = {
        id: "platform-existing",
        igdbPlatformId: 48,
        name: "PlayStation 4",
        abbreviation: "PS4",
        slug: "ps4",
        platformFamily: "PS",
        colorPrimary: "#003087",
        createdAt: new Date("2024-01-01"),
      };

      const mockQuery = {
        platforms: {
          findFirst: async () => existingPlatform,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });
      mockTransaction(mockDb);

      const result = await repository.getOrCreate(48, "PlayStation 4");

      expect(result).not.toBeNull();
      expect(result.id).toBe("platform-existing");
      expect(result.igdb_platform_id).toBe(48);
    });

    it("creates new platform when not found", async () => {
      const newPlatform = {
        id: "platform-new-1",
        igdbPlatformId: 200,
        name: "Xbox Series X",
        abbreviation: "XSX",
        slug: "xbox-series-x",
        platformFamily: "Xbox",
        colorPrimary: "#107c10",
        createdAt: new Date(),
      };

      const mockQuery = {
        platforms: {
          findFirst: async () => null,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });
      mockInsertResult(mockDb, [newPlatform]);
      mockTransaction(mockDb);

      const result = await repository.getOrCreate(200, "Xbox Series X");

      expect(result.igdb_platform_id).toBe(200);
      expect(result.name).toBe("Xbox Series X");
    });

    it("creates platform with custom data", async () => {
      const platformWithData = {
        id: "platform-custom",
        igdbPlatformId: 130,
        name: "Nintendo Switch",
        abbreviation: "Switch",
        slug: "nintendo-switch",
        platformFamily: "Nintendo",
        colorPrimary: "#e60012",
        createdAt: new Date(),
      };

      const mockQuery = {
        platforms: {
          findFirst: async () => null,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });
      mockInsertResult(mockDb, [platformWithData]);
      mockTransaction(mockDb);

      const result = await repository.getOrCreate(130, "Nintendo Switch", {
        abbreviation: "Switch",
        slug: "nintendo-switch",
        platform_family: "Nintendo",
        color_primary: "#e60012",
      });

      expect(result.abbreviation).toBe("Switch");
      expect(result.platform_family).toBe("Nintendo");
    });

    it("uses default color when not provided", async () => {
      const platformDefaultColor = {
        id: "platform-default-color",
        igdbPlatformId: 300,
        name: "Unknown Platform",
        abbreviation: null,
        slug: null,
        platformFamily: null,
        colorPrimary: "#6B7280",
        createdAt: new Date(),
      };

      const mockQuery = {
        platforms: {
          findFirst: async () => null,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });
      mockInsertResult(mockDb, [platformDefaultColor]);
      mockTransaction(mockDb);

      const result = await repository.getOrCreate(300, "Unknown Platform");

      expect(result.color_primary).toBe("#6B7280");
    });
  });

  describe("list", () => {
    it("lists all platforms", async () => {
      const platforms = [
        {
          id: "platform-list-1",
          igdbPlatformId: 6,
          name: "PC (Windows)",
          abbreviation: "PC",
          slug: "pc",
          platformFamily: "pc",
          colorPrimary: "#3498db",
          createdAt: new Date(),
        },
        {
          id: "platform-list-2",
          igdbPlatformId: 167,
          name: "PlayStation 5",
          abbreviation: "PS5",
          slug: "ps5",
          platformFamily: "PS",
          colorPrimary: "#003087",
          createdAt: new Date(),
        },
        {
          id: "platform-list-3",
          igdbPlatformId: 169,
          name: "Xbox Series X",
          abbreviation: "XSX",
          slug: "xbox-series-x",
          platformFamily: "Xbox",
          colorPrimary: "#107c10",
          createdAt: new Date(),
        },
      ];

      const mockQuery = {
        platforms: {
          findMany: async () => platforms,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.list();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe("PC (Windows)");
      expect(result[1].name).toBe("PlayStation 5");
      expect(result[2].name).toBe("Xbox Series X");
    });

    it("returns empty array when no platforms exist", async () => {
      const mockQuery = {
        platforms: {
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

    it("preserves platform data through mapping", async () => {
      const platformRow = {
        id: "platform-preserve",
        igdbPlatformId: 50,
        name: "Nintendo 64",
        abbreviation: "N64",
        slug: "nintendo-64",
        platformFamily: "Nintendo",
        colorPrimary: "#bb00bb",
        createdAt: new Date("2024-01-01"),
      };

      const mockQuery = {
        platforms: {
          findMany: async () => [platformRow],
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.list();

      expect(result[0].abbreviation).toBe("N64");
      expect(result[0].slug).toBe("nintendo-64");
      expect(result[0].platform_family).toBe("Nintendo");
    });
  });

  describe("findByFamily", () => {
    it("returns platforms for a specific family", async () => {
      const psFamily = [
        {
          id: "ps4",
          igdbPlatformId: 48,
          name: "PlayStation 4",
          abbreviation: "PS4",
          slug: "ps4",
          platformFamily: "PS",
          colorPrimary: "#003087",
          createdAt: new Date(),
        },
        {
          id: "ps5",
          igdbPlatformId: 167,
          name: "PlayStation 5",
          abbreviation: "PS5",
          slug: "ps5",
          platformFamily: "PS",
          colorPrimary: "#003087",
          createdAt: new Date(),
        },
      ];

      const mockQuery = {
        platforms: {
          findMany: async () => psFamily,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findByFamily("PS");

      expect(result).toHaveLength(2);
      expect(result[0].platform_family).toBe("PS");
      expect(result[1].platform_family).toBe("PS");
      expect(result[0].name).toBe("PlayStation 4");
      expect(result[1].name).toBe("PlayStation 5");
    });

    it("returns empty array when no platforms in family", async () => {
      const mockQuery = {
        platforms: {
          findMany: async () => [],
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findByFamily("NonexistentFamily");

      expect(result).toHaveLength(0);
    });

    it("returns xbox family platforms", async () => {
      const xboxFamily = [
        {
          id: "xbox-one",
          igdbPlatformId: 165,
          name: "Xbox One",
          abbreviation: "XBO",
          slug: "xbox-one",
          platformFamily: "Xbox",
          colorPrimary: "#107c10",
          createdAt: new Date(),
        },
        {
          id: "xbox-series-x",
          igdbPlatformId: 169,
          name: "Xbox Series X",
          abbreviation: "XSX",
          slug: "xbox-series-x",
          platformFamily: "Xbox",
          colorPrimary: "#107c10",
          createdAt: new Date(),
        },
        {
          id: "xbox-series-s",
          igdbPlatformId: 170,
          name: "Xbox Series S",
          abbreviation: "XSS",
          slug: "xbox-series-s",
          platformFamily: "Xbox",
          colorPrimary: "#107c10",
          createdAt: new Date(),
        },
      ];

      const mockQuery = {
        platforms: {
          findMany: async () => xboxFamily,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findByFamily("Xbox");

      expect(result).toHaveLength(3);
      expect(result.every((p) => p.platform_family === "Xbox")).toBe(true);
    });

    it("returns nintendo family platforms", async () => {
      const nintendoFamily = [
        {
          id: "switch",
          igdbPlatformId: 130,
          name: "Nintendo Switch",
          abbreviation: "Switch",
          slug: "nintendo-switch",
          platformFamily: "Nintendo",
          colorPrimary: "#e60012",
          createdAt: new Date(),
        },
        {
          id: "switch-lite",
          igdbPlatformId: 223,
          name: "Nintendo Switch Lite",
          abbreviation: "Switch Lite",
          slug: "nintendo-switch-lite",
          platformFamily: "Nintendo",
          colorPrimary: "#e60012",
          createdAt: new Date(),
        },
      ];

      const mockQuery = {
        platforms: {
          findMany: async () => nintendoFamily,
        },
      };
      Object.defineProperty(mockDb, "query", {
        value: mockQuery,
        writable: true,
      });

      const result = await repository.findByFamily("Nintendo");

      expect(result).toHaveLength(2);
      expect(result.every((p) => p.platform_family === "Nintendo")).toBe(true);
    });
  });
});
