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
  metadata_source: string | undefined;
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
    metadata_source: legacyGame.metadataSource as string | undefined,
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
