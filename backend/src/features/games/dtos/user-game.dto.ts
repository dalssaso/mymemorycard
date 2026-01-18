import { z } from "zod";

/**
 * Schema for creating a user game entry
 */
export const USER_GAME_CREATE_REQUEST_SCHEMA = z
  .object({
    game_id: z.string().uuid("Invalid game ID"),
    platform_id: z.string().uuid("Invalid platform ID"),
    store_id: z.string().uuid("Invalid store ID").optional(),
  })
  .strict()
  .openapi("UserGameCreateRequest", {
    description: "Request to add a game to user library on a platform",
    example: {
      game_id: "550e8400-e29b-41d4-a716-446655440010",
      platform_id: "550e8400-e29b-41d4-a716-446655440000",
      store_id: "550e8400-e29b-41d4-a716-446655440001",
    },
  });

/**
 * User game create request
 */
export type UserGameCreateRequestDto = z.infer<typeof USER_GAME_CREATE_REQUEST_SCHEMA>;

/**
 * Schema for updating a user game entry
 */
export const USER_GAME_UPDATE_REQUEST_SCHEMA = z
  .object({
    owned: z.boolean().optional(),
    purchased_date: z.string().datetime().optional(),
  })
  .strict()
  .refine((data) => data.owned !== undefined || data.purchased_date !== undefined, {
    message: "At least one field must be provided",
  })
  .openapi("UserGameUpdateRequest", {
    description: "Request to update a user game entry",
    example: {
      owned: true,
      purchased_date: "2024-01-15T12:00:00.000Z",
    },
  });

/**
 * User game update request
 */
export type UserGameUpdateRequestDto = z.infer<typeof USER_GAME_UPDATE_REQUEST_SCHEMA>;

/**
 * Schema for platform information in user game response
 */
const PlatformInfoSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Platform unique identifier",
    example: "550e8400-e29b-41d4-a716-446655440000",
  }),
  name: z.string().openapi({
    description: "Platform name",
    example: "Nintendo Switch",
  }),
  abbreviation: z.string().nullable().openapi({
    description: "Platform abbreviation",
    example: "Switch",
  }),
});

/**
 * Schema for store information in user game response
 */
const StoreInfoSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Store unique identifier",
    example: "550e8400-e29b-41d4-a716-446655440001",
  }),
  slug: z.string().openapi({
    description: "Store slug",
    example: "nintendo-eshop",
  }),
  display_name: z.string().openapi({
    description: "Store display name",
    example: "Nintendo eShop",
  }),
});

/**
 * Schema for game information in user game response
 */
const GameInfoSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Game unique identifier",
    example: "550e8400-e29b-41d4-a716-446655440010",
  }),
  name: z.string().openapi({
    description: "Game title",
    example: "The Legend of Zelda: Breath of the Wild",
  }),
  cover_art_url: z.string().url().nullable().openapi({
    description: "URL to cover art image",
  }),
  igdb_id: z.number().int().nullable().openapi({
    description: "IGDB game identifier",
    example: 7346,
  }),
});

/**
 * Schema for user game response
 */
export const USER_GAME_RESPONSE_SCHEMA = z
  .object({
    id: z.string().uuid().openapi({
      description: "User game entry unique identifier",
      example: "550e8400-e29b-41d4-a716-446655440020",
    }),
    user_id: z.string().uuid().openapi({
      description: "User unique identifier",
      example: "550e8400-e29b-41d4-a716-446655440030",
    }),
    game: GameInfoSchema.openapi({
      description: "Game information",
    }),
    platform: PlatformInfoSchema.openapi({
      description: "Platform information",
    }),
    store: StoreInfoSchema.nullable().openapi({
      description: "Store information (null if not purchased from a store)",
    }),
    platform_game_id: z.string().nullable().openapi({
      description: "Platform-specific game identifier (e.g., Steam App ID)",
      example: "291570",
    }),
    owned: z.boolean().openapi({
      description: "Whether the user owns this game on this platform",
      example: true,
    }),
    purchased_date: z.string().datetime().nullable().openapi({
      description: "Date when user purchased the game",
      example: "2020-01-15T12:00:00.000Z",
    }),
    import_source: z.string().nullable().openapi({
      description: "Source of import if applicable (steam, rawg, etc.)",
      example: "steam",
    }),
    created_at: z.string().datetime().openapi({
      description: "Timestamp when entry was created",
    }),
  })
  .openapi("UserGameResponse", {
    description: "User game library entry with related game, platform, and store info",
  });

/**
 * User game response
 */
export type UserGameResponseDto = z.infer<typeof USER_GAME_RESPONSE_SCHEMA>;

/**
 * Schema for user game list response
 */
export const USER_GAME_LIST_RESPONSE_SCHEMA = z
  .object({
    user_games: z.array(USER_GAME_RESPONSE_SCHEMA).max(500).openapi({ maxItems: 500 }),
  })
  .openapi("UserGameListResponse", {
    description: "List of user game library entries",
  });

/**
 * User game list response
 */
export type UserGameListResponseDto = z.infer<typeof USER_GAME_LIST_RESPONSE_SCHEMA>;

/**
 * Schema for user game ID parameter
 */
export const USER_GAME_ID_PARAMS_SCHEMA = z
  .object({
    id: z.string().uuid("Invalid user game ID"),
  })
  .openapi("UserGameIdParams", {
    description: "User game ID path parameter",
  });

/**
 * User game ID parameter
 */
export type UserGameIdParamsDto = z.infer<typeof USER_GAME_ID_PARAMS_SCHEMA>;
