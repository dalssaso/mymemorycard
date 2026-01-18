import { z } from "zod";

/**
 * Schema for Steam connect response
 */
export const STEAM_CONNECT_RESPONSE_SCHEMA = z
  .object({
    redirect_url: z.string().url().openapi({
      description: "Steam OpenID login URL",
      example: "https://steamcommunity.com/openid/login?...",
    }),
  })
  .openapi("SteamConnectResponse", {
    description: "Steam OpenID authentication redirect URL",
  });

/**
 * Steam connect response
 */
export type SteamConnectResponseDto = z.infer<typeof STEAM_CONNECT_RESPONSE_SCHEMA>;

/**
 * Schema for Steam callback response
 */
export const STEAM_CALLBACK_RESPONSE_SCHEMA = z
  .object({
    status: z.enum(["linked", "failed"]).openapi({
      description: "Link status",
      example: "linked",
    }),
    steam_id: z.string().optional().openapi({
      description: "Steam 64-bit ID",
      example: "76561198012345678",
    }),
    display_name: z.string().optional().openapi({
      description: "Steam display name",
      example: "PlayerOne",
    }),
    avatar_url: z.string().url().optional().openapi({
      description: "Steam avatar URL",
      example: "https://avatars.steamstatic.com/abc123.jpg",
    }),
  })
  .openapi("SteamCallbackResponse", {
    description: "Steam account link result",
  });

/**
 * Steam callback response
 */
export type SteamCallbackResponseDto = z.infer<typeof STEAM_CALLBACK_RESPONSE_SCHEMA>;

/**
 * Schema for Steam library import response
 */
export const STEAM_LIBRARY_IMPORT_RESPONSE_SCHEMA = z
  .object({
    imported: z.number().int().openapi({
      description: "Number of games imported",
      example: 42,
    }),
    skipped: z.number().int().openapi({
      description: "Number of games skipped (already in library)",
      example: 5,
    }),
    errors: z
      .array(
        z.object({
          appid: z.number().int().openapi({
            description: "Steam App ID",
            example: 570,
          }),
          name: z.string().openapi({
            description: "Game name",
            example: "Dota 2",
          }),
          error: z.string().openapi({
            description: "Error message",
            example: "Failed to fetch game metadata",
          }),
        })
      )
      .max(100)
      .openapi({
        description: "Games that failed to import",
        maxItems: 100,
      }),
  })
  .openapi("SteamLibraryImportResponse", {
    description: "Steam library import result",
  });

/**
 * Steam library import response
 */
export type SteamLibraryImportResponseDto = z.infer<typeof STEAM_LIBRARY_IMPORT_RESPONSE_SCHEMA>;

/**
 * Schema for Steam sync request
 */
export const STEAM_SYNC_REQUEST_SCHEMA = z
  .object({
    game_id: z.string().uuid("Invalid game ID").openapi({
      description: "Game ID to sync achievements for",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
  })
  .openapi("SteamSyncRequest", {
    description: "Request to sync Steam achievements for a game",
  });

/**
 * Steam sync request
 */
export type SteamSyncRequestDto = z.infer<typeof STEAM_SYNC_REQUEST_SCHEMA>;

/**
 * Schema for Steam sync response
 */
export const STEAM_SYNC_RESPONSE_SCHEMA = z
  .object({
    synced: z.number().int().openapi({
      description: "Total achievements synced",
      example: 50,
    }),
    unlocked: z.number().int().openapi({
      description: "Achievements unlocked by user",
      example: 25,
    }),
    total: z.number().int().openapi({
      description: "Total achievements for game",
      example: 50,
    }),
  })
  .openapi("SteamSyncResponse", {
    description: "Steam achievements sync result",
  });

/**
 * Steam sync response
 */
export type SteamSyncResponseDto = z.infer<typeof STEAM_SYNC_RESPONSE_SCHEMA>;
