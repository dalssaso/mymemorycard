import {
  buildCoverUrl,
  IGDB_WEBSITE_CATEGORY_TO_STORE,
  type IgdbGame,
  type IgdbPlatform,
  type IgdbWebsite,
} from "./igdb.types";

/**
 * Game search result mapped from IGDB.
 */
export interface GameSearchResult {
  igdb_id: number;
  name: string;
  cover_url: string | null;
  platforms: Array<{
    igdb_platform_id: number;
    name: string;
    abbreviation: string | null;
  }>;
  franchise: string | null;
  stores: Array<{ slug: string; url: string }>;
}

/**
 * Game details mapped from IGDB.
 */
export interface GameDetails {
  igdb_id: number;
  name: string;
  slug: string;
  summary: string | null;
  storyline: string | null;
  cover_url: string | null;
  release_date: string | null;
  rating: number | null;
  genres: string[];
  themes: string[];
  game_modes: string[];
  platforms: Array<{
    igdb_platform_id: number;
    name: string;
    abbreviation: string | null;
  }>;
  franchise: string | null;
  stores: Array<{ slug: string; url: string }>;
}

/**
 * Platform mapped from IGDB.
 */
export interface PlatformFromIgdb {
  igdb_platform_id: number;
  name: string;
  abbreviation: string | null;
  slug: string;
  platform_family: string | null;
}

/**
 * Map IGDB game to search result format.
 *
 * @param game - IGDB game response
 * @returns Mapped search result
 */
export function mapIgdbGameToSearchResult(game: IgdbGame): GameSearchResult {
  return {
    igdb_id: game.id,
    name: game.name,
    cover_url: game.cover?.image_id ? buildCoverUrl(game.cover.image_id) : null,
    platforms: (game.platforms ?? []).map((p) => ({
      igdb_platform_id: p.id,
      name: p.name ?? "",
      abbreviation: p.abbreviation ?? null,
    })),
    franchise: game.franchises?.[0]?.name ?? null,
    stores: extractStoresFromWebsites(game.websites),
  };
}

/**
 * Map IGDB game to full game details format.
 *
 * @param game - IGDB game response
 * @returns Mapped game details
 */
export function mapIgdbGameToGameDetails(game: IgdbGame): GameDetails {
  return {
    igdb_id: game.id,
    name: game.name,
    slug: game.slug,
    summary: game.summary ?? null,
    storyline: game.storyline ?? null,
    cover_url: game.cover?.image_id ? buildCoverUrl(game.cover.image_id) : null,
    release_date: game.first_release_date
      ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
      : null,
    rating: game.aggregated_rating ?? game.total_rating ?? null,
    genres: (game.genres ?? []).map((g) => g.name),
    themes: (game.themes ?? []).map((t) => t.name),
    game_modes: (game.game_modes ?? []).map((m) => m.name),
    platforms: (game.platforms ?? []).map((p) => ({
      igdb_platform_id: p.id,
      name: p.name ?? "",
      abbreviation: p.abbreviation ?? null,
    })),
    franchise: game.franchises?.[0]?.name ?? null,
    stores: extractStoresFromWebsites(game.websites),
  };
}

/**
 * Map IGDB platform to domain platform format.
 *
 * @param platform - IGDB platform response
 * @returns Mapped platform
 */
export function mapIgdbPlatformToPlatform(platform: IgdbPlatform): PlatformFromIgdb {
  return {
    igdb_platform_id: platform.id,
    name: platform.name,
    abbreviation: platform.abbreviation ?? null,
    slug: platform.slug,
    platform_family: platform.platform_family?.name ?? null,
  };
}

/**
 * Extract known stores from IGDB website links.
 *
 * @param websites - IGDB website array
 * @returns Array of store slugs and URLs
 */
export function extractStoresFromWebsites(
  websites?: IgdbWebsite[]
): Array<{ slug: string; url: string }> {
  if (!websites) return [];

  return websites
    .filter((w) => IGDB_WEBSITE_CATEGORY_TO_STORE[w.category])
    .map((w) => ({
      slug: IGDB_WEBSITE_CATEGORY_TO_STORE[w.category],
      url: w.url,
    }));
}
