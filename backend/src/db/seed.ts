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
 * Uses upsert to update existing stores on conflict.
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
