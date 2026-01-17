import { z } from "zod";

/**
 * Schema for game search request
 */
export const GAME_SEARCH_REQUEST_SCHEMA = z
  .object({
    query: z
      .string()
      .min(1, "Search query cannot be empty")
      .max(255, "Search query must be 255 characters or less"),
    limit: z
      .number()
      .int()
      .min(1, "Limit must be at least 1")
      .max(100, "Limit cannot exceed 100")
      .optional()
      .default(20),
  })
  .strict()
  .openapi("GameSearchRequest", {
    description: "Request to search for games",
    example: {
      query: "The Legend of Zelda",
      limit: 20,
    },
  });

/**
 * Game search request
 */
export type GameSearchRequestDto = z.infer<typeof GAME_SEARCH_REQUEST_SCHEMA>;

/**
 * Schema for game import request
 */
export const GAME_IMPORT_REQUEST_SCHEMA = z
  .object({
    igdb_id: z.number().int().positive("IGDB ID must be a positive integer"),
    platform_id: z.string().uuid("Invalid platform ID"),
    store_id: z.string().uuid("Invalid store ID").optional(),
  })
  .strict()
  .openapi("GameImportRequest", {
    description: "Request to import a game from IGDB",
    example: {
      igdb_id: 1020,
      platform_id: "550e8400-e29b-41d4-a716-446655440000",
      store_id: "550e8400-e29b-41d4-a716-446655440001",
    },
  });

/**
 * Game import request
 */
export type GameImportRequestDto = z.infer<typeof GAME_IMPORT_REQUEST_SCHEMA>;

/**
 * Schema for game update request (metadata refresh from IGDB)
 */
export const GAME_UPDATE_REQUEST_SCHEMA = z.object({}).strict().openapi("GameUpdateRequest", {
  description: "Request to refresh game metadata from IGDB",
});

/**
 * Game update request
 */
export type GameUpdateRequestDto = z.infer<typeof GAME_UPDATE_REQUEST_SCHEMA>;

/**
 * Schema for game search result - matches IGDB mapper output
 */
export const GAME_SEARCH_RESULT_SCHEMA = z
  .object({
    igdb_id: z.number().int().openapi({
      description: "IGDB game identifier",
      example: 1020,
    }),
    name: z.string().openapi({
      description: "Game title",
      example: "The Legend of Zelda: Breath of the Wild",
    }),
    cover_url: z.string().url().nullable().openapi({
      description: "URL to cover art image",
      example: "https://images.igdb.com/igdb/image/upload/...",
    }),
    platforms: z
      .array(
        z.object({
          igdb_platform_id: z.number().int().openapi({
            description: "IGDB platform identifier",
            example: 6,
          }),
          name: z.string().openapi({
            description: "Platform name",
            example: "PC",
          }),
          abbreviation: z.string().nullable().openapi({
            description: "Platform abbreviation",
            example: "PC",
          }),
        })
      )
      .openapi({
        description: "Available platforms for this game",
      }),
    franchise: z.string().nullable().openapi({
      description: "Game franchise name",
      example: "The Legend of Zelda",
    }),
    stores: z
      .array(
        z.object({
          slug: z.string().openapi({
            description: "Store slug",
            example: "steam",
          }),
          url: z.string().url().openapi({
            description: "Store URL for the game",
            example: "https://store.steampowered.com/app/291570",
          }),
        })
      )
      .openapi({
        description: "Digital stores where game is available",
      }),
  })
  .openapi("GameSearchResult", {
    description: "Game search result from IGDB",
  });

/**
 * Game search result
 */
export type GameSearchResultDto = z.infer<typeof GAME_SEARCH_RESULT_SCHEMA>;

/**
 * Schema for game details
 */
export const GAME_DETAILS_SCHEMA = z
  .object({
    id: z.string().uuid().openapi({
      description: "Game unique identifier",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
    igdb_id: z.number().int().nullable().openapi({
      description: "IGDB game identifier",
      example: 1020,
    }),
    rawg_id: z.number().int().nullable().openapi({
      description: "RAWG game identifier",
      example: 3328,
    }),
    name: z.string().openapi({
      description: "Game title",
      example: "The Legend of Zelda: Breath of the Wild",
    }),
    slug: z.string().nullable().openapi({
      description: "URL-friendly game identifier",
      example: "the-legend-of-zelda-breath-of-the-wild",
    }),
    release_date: z.string().datetime().nullable().openapi({
      description: "Game release date",
      example: "2017-03-03T00:00:00.000Z",
    }),
    description: z.string().nullable().openapi({
      description: "Full game description or synopsis",
    }),
    cover_art_url: z.string().url().nullable().openapi({
      description: "URL to cover art image",
    }),
    background_image_url: z.string().url().nullable().openapi({
      description: "URL to background image",
    }),
    metacritic_score: z.number().int().min(0).max(100).nullable().openapi({
      description: "Metacritic score",
      example: 97,
    }),
    opencritic_score: z.number().min(0).max(100).nullable().openapi({
      description: "OpenCritic score",
      example: 96.5,
    }),
    esrb_rating: z.string().nullable().openapi({
      description: "ESRB rating (E, E10+, T, M, AO)",
      example: "E10+",
    }),
    series_name: z.string().nullable().openapi({
      description: "Name of game series",
      example: "The Legend of Zelda",
    }),
    expected_playtime: z.number().int().nullable().openapi({
      description: "Expected playtime in hours",
      example: 50,
    }),
    metadata_source: z.enum(["igdb", "rawg", "manual"]).openapi({
      description: "Source of metadata",
      example: "igdb",
    }),
    created_at: z.string().datetime().openapi({
      description: "Timestamp when game was added",
    }),
    updated_at: z.string().datetime().openapi({
      description: "Timestamp when game was last updated",
    }),
  })
  .openapi("GameDetails", {
    description: "Complete game details with metadata",
  });

/**
 * Game details response
 */
export type GameDetailsDto = z.infer<typeof GAME_DETAILS_SCHEMA>;

/**
 * Schema for full game response
 */
export const GAME_RESPONSE_SCHEMA = z
  .object({
    game: GAME_DETAILS_SCHEMA,
  })
  .openapi("GameResponse", {
    description: "Full game response",
  });

/**
 * Full game response
 */
export type GameResponseDto = z.infer<typeof GAME_RESPONSE_SCHEMA>;

/**
 * Schema for game list response
 */
export const GAME_LIST_RESPONSE_SCHEMA = z
  .object({
    games: z.array(GAME_DETAILS_SCHEMA).max(500).openapi({ maxItems: 500 }),
  })
  .openapi("GameListResponse", {
    description: "List of games",
  });

/**
 * Game list response
 */
export type GameListResponseDto = z.infer<typeof GAME_LIST_RESPONSE_SCHEMA>;

/**
 * Schema for game search results response
 */
export const GAME_SEARCH_RESULTS_RESPONSE_SCHEMA = z
  .object({
    results: z.array(GAME_SEARCH_RESULT_SCHEMA).max(100).openapi({ maxItems: 100 }),
  })
  .openapi("GameSearchResultsResponse", {
    description: "Game search results",
  });

/**
 * Game search results response
 */
export type GameSearchResultsResponseDto = z.infer<typeof GAME_SEARCH_RESULTS_RESPONSE_SCHEMA>;

/**
 * Schema for game ID parameter
 */
export const GAME_ID_PARAMS_SCHEMA = z
  .object({
    id: z.string().uuid("Invalid game ID"),
  })
  .openapi("GameIdParams", {
    description: "Game ID path parameter",
  });

/**
 * Game ID parameter
 */
export type GameIdParamsDto = z.infer<typeof GAME_ID_PARAMS_SCHEMA>;
