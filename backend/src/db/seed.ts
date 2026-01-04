import { db, schema } from "./index";
import { sql } from "drizzle-orm";

const DISC_ICON_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 5.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z'/%3E%3C/svg%3E";

type PlatformSeed = {
  name: string;
  displayName: string;
  platformType: "pc" | "console" | "mobile" | "physical";
  isSystem: boolean;
  isPhysical?: boolean;
  colorPrimary: string;
  websiteUrl?: string;
  defaultIconUrl?: string;
  sortOrder: number;
};

const systemPlatforms: PlatformSeed[] = [
  // PC Stores (100-199)
  {
    name: "steam",
    displayName: "Steam",
    platformType: "pc",
    isSystem: true,
    colorPrimary: "#1B2838",
    websiteUrl: "https://store.steampowered.com",
    sortOrder: 100,
  },
  {
    name: "epic-games-store",
    displayName: "Epic Games",
    platformType: "pc",
    isSystem: true,
    colorPrimary: "#313131",
    websiteUrl: "https://store.epicgames.com",
    sortOrder: 101,
  },
  {
    name: "gog",
    displayName: "GOG",
    platformType: "pc",
    isSystem: true,
    colorPrimary: "#86328A",
    websiteUrl: "https://www.gog.com",
    sortOrder: 102,
  },
  {
    name: "battle-net",
    displayName: "Battle.net",
    platformType: "pc",
    isSystem: true,
    colorPrimary: "#148EFF",
    websiteUrl: "https://www.blizzard.com/apps/battle.net",
    sortOrder: 103,
  },
  {
    name: "ea-app",
    displayName: "EA App",
    platformType: "pc",
    isSystem: true,
    colorPrimary: "#FF0844",
    websiteUrl: "https://www.ea.com/ea-app",
    sortOrder: 104,
  },
  {
    name: "ubisoft-connect",
    displayName: "Ubisoft Connect",
    platformType: "pc",
    isSystem: true,
    colorPrimary: "#0080FF",
    websiteUrl: "https://ubisoftconnect.com",
    sortOrder: 105,
  },
  {
    name: "rockstar-games-launcher",
    displayName: "Rockstar Games Launcher",
    platformType: "pc",
    isSystem: true,
    colorPrimary: "#FCAF17",
    websiteUrl: "https://www.rockstargames.com/rockstar-games-launcher",
    sortOrder: 106,
  },
  {
    name: "bethesda-launcher",
    displayName: "Bethesda",
    platformType: "pc",
    isSystem: true,
    colorPrimary: "#D4AF37",
    websiteUrl: "https://bethesda.net",
    sortOrder: 107,
  },

  // Console Stores (200-299)
  {
    name: "playstation-network",
    displayName: "PlayStation Network",
    platformType: "console",
    isSystem: true,
    colorPrimary: "#0070CC",
    websiteUrl: "https://www.playstation.com",
    sortOrder: 200,
  },
  {
    name: "xbox",
    displayName: "Xbox",
    platformType: "console",
    isSystem: true,
    colorPrimary: "#107C10",
    websiteUrl: "https://www.xbox.com",
    sortOrder: 201,
  },
  {
    name: "nintendo-eshop",
    displayName: "Nintendo eShop",
    platformType: "console",
    isSystem: true,
    colorPrimary: "#E60012",
    websiteUrl: "https://www.nintendo.com",
    sortOrder: 202,
  },

  // Mobile Stores (300-399)
  {
    name: "apple-app-store",
    displayName: "Apple App Store",
    platformType: "mobile",
    isSystem: true,
    colorPrimary: "#007AFF",
    websiteUrl: "https://apps.apple.com",
    sortOrder: 300,
  },
  {
    name: "google-play-store",
    displayName: "Google Play Store",
    platformType: "mobile",
    isSystem: true,
    colorPrimary: "#01875F",
    websiteUrl: "https://play.google.com",
    sortOrder: 301,
  },

  // Physical (400-499)
  {
    name: "physical-copy",
    displayName: "Physical Copy",
    platformType: "physical",
    isSystem: true,
    isPhysical: true,
    colorPrimary: "#6B7280",
    defaultIconUrl: DISC_ICON_SVG,
    sortOrder: 400,
  },
  {
    name: "playstation-physical",
    displayName: "PlayStation Physical",
    platformType: "physical",
    isSystem: true,
    isPhysical: true,
    colorPrimary: "#0070CC",
    sortOrder: 401,
  },
  {
    name: "xbox-physical",
    displayName: "Xbox Physical",
    platformType: "physical",
    isSystem: true,
    isPhysical: true,
    colorPrimary: "#107C10",
    sortOrder: 402,
  },
  {
    name: "nintendo-physical",
    displayName: "Nintendo Physical",
    platformType: "physical",
    isSystem: true,
    isPhysical: true,
    colorPrimary: "#E60012",
    sortOrder: 403,
  },
  {
    name: "pc-physical",
    displayName: "PC Physical",
    platformType: "physical",
    isSystem: true,
    isPhysical: true,
    colorPrimary: "#4B5563",
    sortOrder: 404,
  },
];

export async function seedPlatforms(): Promise<void> {
  console.log("Seeding system platforms...");

  for (const platform of systemPlatforms) {
    await db
      .insert(schema.platforms)
      .values({
        name: platform.name,
        displayName: platform.displayName,
        platformType: platform.platformType,
        isSystem: platform.isSystem,
        isPhysical: platform.isPhysical ?? false,
        colorPrimary: platform.colorPrimary,
        websiteUrl: platform.websiteUrl,
        defaultIconUrl: platform.defaultIconUrl,
        sortOrder: platform.sortOrder,
      })
      .onConflictDoUpdate({
        target: schema.platforms.name,
        set: {
          displayName: sql`EXCLUDED.display_name`,
          platformType: sql`EXCLUDED.platform_type`,
          isSystem: sql`EXCLUDED.is_system`,
          isPhysical: sql`EXCLUDED.is_physical`,
          colorPrimary: sql`EXCLUDED.color_primary`,
          websiteUrl: sql`EXCLUDED.website_url`,
          defaultIconUrl: sql`EXCLUDED.default_icon_url`,
          sortOrder: sql`EXCLUDED.sort_order`,
        },
      });
  }

  console.log("Platforms seeded successfully");
}
