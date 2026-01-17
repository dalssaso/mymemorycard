import type {
  GameSearchResult as SdkGameSearchResult,
  GameSearchResultsResponse,
  UserGameListResponse,
  UserGameResponse,
} from "../generated";
import type { GameSearchResult, IgdbStoreInfo } from "@/shared/types";
import type { Game } from "../services";

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
        display_name: s.slug, // Use slug as display_name fallback
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
    igdb_id: null, // SDK doesn't expose igdb_id in UserGameResponse
    status: null, // SDK uses owned/purchased_date instead of status
    rating: null, // Not in current SDK response
    notes: null, // Not in current SDK response
    created_at: sdk.created_at,
    updated_at: sdk.created_at, // SDK only has created_at
  };
}

/**
 * Adapts SDK user games list to frontend format.
 *
 * @param sdk - SDK UserGameListResponse from generated API client
 * @returns Object with games array and pagination metadata
 */
export function adaptUserGamesListResponse(sdk: UserGameListResponse): {
  games: Game[];
  total: number;
  page: number;
  per_page: number;
} {
  return {
    games: sdk.user_games.map(adaptUserGame),
    total: sdk.user_games.length, // SDK doesn't provide pagination yet
    page: 1,
    per_page: sdk.user_games.length,
  };
}
