import type {
  GameSearchResult as SdkGameSearchResult,
  GameSearchResultsResponse,
  UserGameListResponse,
  UserGameResponse,
} from "../generated";
import type { GameSearchResult, IgdbStoreInfo } from "@/shared/types";
import type { Game } from "../services";

/**
 * Maps store slugs to human-readable display names.
 * Keys are lowercase slugs from IGDB, values are display names.
 */
const STORE_DISPLAY_NAMES: Record<string, string> = {
  steam: "Steam",
  gog: "GOG.com",
  "epic-games-store": "Epic Games Store",
  "playstation-store": "PlayStation Store",
  "xbox-store": "Xbox Store",
  "nintendo-eshop": "Nintendo eShop",
  "itch-io": "itch.io",
  "humble-store": "Humble Store",
  "amazon-games": "Amazon Games",
  "microsoft-store": "Microsoft Store",
  origin: "Origin",
  uplay: "Ubisoft Connect",
  "battle-net": "Battle.net",
  "google-play": "Google Play",
  "app-store": "App Store",
};

/**
 * Gets the human-readable display name for a store slug.
 * Falls back to capitalizing the slug if not found in the lookup table.
 *
 * @param slug - The store slug (lowercase, hyphenated)
 * @returns Human-readable store display name
 */
function getStoreDisplayName(slug: string): string {
  const displayName = STORE_DISPLAY_NAMES[slug.toLowerCase()];
  if (displayName) {
    return displayName;
  }
  // Fallback: capitalize each word
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Normalized game object with snake_case fields.
 * Used during migration from legacy camelCase endpoints to DI snake_case endpoints.
 */
export interface AdaptedGame {
  id: string;
  name: string;
  cover_art_url: string | null;
  platform_id: string | null;
  store_id: string | null;
  igdb_id: number | null;
  metadata_source: string | null;
}

/**
 * Normalizes a legacy camelCase game response to snake_case.
 * Used during migration from legacy endpoints to DI endpoints.
 *
 * @param legacyGame - Game object with camelCase fields from legacy API
 * @returns Normalized game object with snake_case fields
 */
export function adaptGameResponse(legacyGame: Record<string, unknown>): AdaptedGame {
  return {
    id: legacyGame.id as string,
    name: legacyGame.name as string,
    cover_art_url: (legacyGame.coverArtUrl as string | null | undefined) ?? null,
    platform_id: (legacyGame.platformId as string | null | undefined) ?? null,
    store_id: (legacyGame.storeId as string | null | undefined) ?? null,
    igdb_id: (legacyGame.igdbId as number | null | undefined) ?? null,
    metadata_source: (legacyGame.metadataSource as string | null | undefined) ?? null,
  };
}

/**
 * Normalizes an array of legacy game responses to snake_case.
 *
 * @param legacyGames - Array of game objects with camelCase fields from legacy API
 * @returns Array of normalized game objects with snake_case fields
 */
export function adaptGamesListResponse(legacyGames: Record<string, unknown>[]): AdaptedGame[] {
  return legacyGames.map(adaptGameResponse);
}

/**
 * Adapts SDK search result to frontend GameSearchResult type.
 * Transforms cover_url to cover_art_url and normalizes store shape.
 *
 * @param sdk - SDK GameSearchResult from generated API client
 * @returns Frontend GameSearchResult with normalized fields
 */
export function adaptSearchResult(sdk: SdkGameSearchResult): GameSearchResult {
  return {
    igdb_id: sdk.igdb_id,
    name: sdk.name,
    cover_art_url: sdk.cover_url,
    release_date: null, // SDK doesn't include release_date in search
    platforms: sdk.platforms.map((p) => ({
      igdb_platform_id: p.igdb_platform_id,
      name: p.name,
    })),
    stores: sdk.stores.map(
      (s): IgdbStoreInfo => ({
        slug: s.slug,
        display_name: getStoreDisplayName(s.slug),
      })
    ),
    franchise: sdk.franchise ?? undefined,
  };
}

/**
 * Adapts SDK search response to frontend format.
 *
 * @param sdk - SDK GameSearchResultsResponse from generated API client
 * @returns Object with games array in frontend format
 */
export function adaptSearchResponse(sdk: GameSearchResultsResponse): {
  games: GameSearchResult[];
} {
  return {
    games: sdk.results.map(adaptSearchResult),
  };
}

/**
 * Adapts SDK UserGameResponse to frontend Game type.
 * Maps nested platform/store objects to flat IDs and normalizes field names.
 *
 * @param sdk - SDK UserGameResponse from generated API client
 * @returns Frontend Game type with flat structure
 */
export function adaptUserGame(sdk: UserGameResponse): Game {
  return {
    id: sdk.id,
    name: sdk.game.name,
    cover_art_url: sdk.game.cover_art_url,
    platform_id: sdk.platform.id,
    store_id: sdk.store?.id ?? null,
    igdb_id: sdk.game.igdb_id ?? null,
    status: null, // SDK uses owned/purchased_date instead of status
    rating: null, // Not in current SDK response
    notes: null, // Not in current SDK response
    created_at: sdk.created_at,
    updated_at: null, // SDK doesn't provide updated_at
  };
}

/**
 * Adapts SDK user games list to frontend format.
 * Note: The SDK does not support pagination yet, so has_pagination is false.
 *
 * @param sdk - SDK UserGameListResponse from generated API client
 * @returns Object with games array and pagination metadata
 */
export function adaptUserGamesListResponse(sdk: UserGameListResponse): {
  games: Game[];
  total: number;
  page: number;
  per_page: number;
  has_pagination: boolean;
} {
  return {
    games: sdk.user_games.map(adaptUserGame),
    total: sdk.user_games.length, // SDK doesn't provide pagination yet
    page: 1,
    per_page: sdk.user_games.length,
    has_pagination: false, // SDK doesn't support pagination yet
  };
}
