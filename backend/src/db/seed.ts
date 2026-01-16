import { db, schema } from "./index";

type StoreSeed = {
  slug: string;
  displayName: string;
  storeType: "digital" | "physical";
  platformFamily: string | null;
  colorPrimary: string;
  websiteUrl: string | null;
  supportsAchievements: boolean;
  supportsLibrarySync: boolean;
  igdbWebsiteCategory: number | null;
  sortOrder: number;
};

const systemStores: StoreSeed[] = [
  // PC Stores
  {
    slug: "steam",
    displayName: "Steam",
    storeType: "digital",
    platformFamily: "PC",
    colorPrimary: "#1B2838",
    websiteUrl: "https://store.steampowered.com",
    supportsAchievements: true,
    supportsLibrarySync: true,
    igdbWebsiteCategory: 13,
    sortOrder: 1,
  },
  {
    slug: "epic",
    displayName: "Epic Games",
    storeType: "digital",
    platformFamily: "PC",
    colorPrimary: "#313131",
    websiteUrl: "https://store.epicgames.com",
    supportsAchievements: false,
    supportsLibrarySync: false,
    igdbWebsiteCategory: 16,
    sortOrder: 2,
  },
  {
    slug: "gog",
    displayName: "GOG",
    storeType: "digital",
    platformFamily: "PC",
    colorPrimary: "#86328A",
    websiteUrl: "https://www.gog.com",
    supportsAchievements: false,
    supportsLibrarySync: false,
    igdbWebsiteCategory: 17,
    sortOrder: 3,
  },
  {
    slug: "battlenet",
    displayName: "Battle.net",
    storeType: "digital",
    platformFamily: "PC",
    colorPrimary: "#148EFF",
    websiteUrl: "https://battle.net",
    supportsAchievements: false,
    supportsLibrarySync: false,
    igdbWebsiteCategory: null,
    sortOrder: 4,
  },
  {
    slug: "ea",
    displayName: "EA App",
    storeType: "digital",
    platformFamily: "PC",
    colorPrimary: "#FF0844",
    websiteUrl: "https://www.ea.com",
    supportsAchievements: false,
    supportsLibrarySync: false,
    igdbWebsiteCategory: 15,
    sortOrder: 5,
  },
  {
    slug: "ubisoft",
    displayName: "Ubisoft Connect",
    storeType: "digital",
    platformFamily: "PC",
    colorPrimary: "#0080FF",
    websiteUrl: "https://ubisoftconnect.com",
    supportsAchievements: false,
    supportsLibrarySync: false,
    igdbWebsiteCategory: null,
    sortOrder: 6,
  },
  // Console Stores
  {
    slug: "psn",
    displayName: "PlayStation Network",
    storeType: "digital",
    platformFamily: "PlayStation",
    colorPrimary: "#0070CC",
    websiteUrl: "https://store.playstation.com",
    supportsAchievements: true,
    supportsLibrarySync: false,
    igdbWebsiteCategory: 10,
    sortOrder: 7,
  },
  {
    slug: "xbox",
    displayName: "Xbox",
    storeType: "digital",
    platformFamily: "Xbox",
    colorPrimary: "#107C10",
    websiteUrl: "https://www.xbox.com",
    supportsAchievements: true,
    supportsLibrarySync: false,
    igdbWebsiteCategory: 12,
    sortOrder: 8,
  },
  {
    slug: "eshop",
    displayName: "Nintendo eShop",
    storeType: "digital",
    platformFamily: "Nintendo",
    colorPrimary: "#E60012",
    websiteUrl: "https://www.nintendo.com",
    supportsAchievements: false,
    supportsLibrarySync: false,
    igdbWebsiteCategory: 11,
    sortOrder: 9,
  },
  // Physical
  {
    slug: "physical",
    displayName: "Physical",
    storeType: "physical",
    platformFamily: null,
    colorPrimary: "#6B7280",
    websiteUrl: null,
    supportsAchievements: false,
    supportsLibrarySync: false,
    igdbWebsiteCategory: null,
    sortOrder: 100,
  },
];

/**
 * Seeds the stores table with predefined store data.
 * Inserts systemStores and ignores conflicts (onConflictDoNothing),
 * leaving existing records unchanged.
 */
export async function seedStores(): Promise<void> {
  console.log("Seeding stores...");

  for (const store of systemStores) {
    await db
      .insert(schema.stores)
      .values({
        slug: store.slug,
        displayName: store.displayName,
        storeType: store.storeType,
        platformFamily: store.platformFamily,
        colorPrimary: store.colorPrimary,
        websiteUrl: store.websiteUrl,
        supportsAchievements: store.supportsAchievements,
        supportsLibrarySync: store.supportsLibrarySync,
        igdbWebsiteCategory: store.igdbWebsiteCategory,
        sortOrder: store.sortOrder,
      })
      .onConflictDoNothing();
  }

  console.log("Stores seeded successfully");
}

/**
 * @deprecated Use seedStores() instead. Platforms are now IGDB-driven.
 */
export async function seedPlatforms(): Promise<void> {
  console.log("seedPlatforms() is deprecated - platforms are now IGDB-driven");
  console.log("Calling seedStores() instead...");
  await seedStores();
}

type TestPlatformSeed = {
  igdbPlatformId: number;
  name: string;
  abbreviation: string;
  slug: string;
  platformFamily: string;
  colorPrimary: string;
};

const testPlatforms: TestPlatformSeed[] = [
  {
    igdbPlatformId: 6,
    name: "PC (Microsoft Windows)",
    abbreviation: "PC",
    slug: "win",
    platformFamily: "PC",
    colorPrimary: "#0078D4",
  },
  {
    igdbPlatformId: 167,
    name: "PlayStation 5",
    abbreviation: "PS5",
    slug: "ps5",
    platformFamily: "PlayStation",
    colorPrimary: "#0070CC",
  },
  {
    igdbPlatformId: 169,
    name: "Xbox Series X|S",
    abbreviation: "XSX",
    slug: "xbox-series-xs",
    platformFamily: "Xbox",
    colorPrimary: "#107C10",
  },
  {
    igdbPlatformId: 130,
    name: "Nintendo Switch",
    abbreviation: "NSW",
    slug: "switch",
    platformFamily: "Nintendo",
    colorPrimary: "#E60012",
  },
];

/**
 * Seeds minimal platform data for integration tests.
 * Creates a few common platforms that would normally come from IGDB.
 */
export async function seedTestPlatforms(): Promise<void> {
  console.log("Seeding test platforms...");

  for (const platform of testPlatforms) {
    await db
      .insert(schema.platforms)
      .values({
        igdbPlatformId: platform.igdbPlatformId,
        name: platform.name,
        abbreviation: platform.abbreviation,
        slug: platform.slug,
        platformFamily: platform.platformFamily,
        colorPrimary: platform.colorPrimary,
      })
      .onConflictDoNothing();
  }

  console.log("Test platforms seeded successfully");
}
