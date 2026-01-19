import { z } from "zod";

/**
 * Schema for RetroAchievements credentials request
 */
export const RA_CREDENTIALS_REQUEST_SCHEMA = z
  .object({
    username: z.string().min(1).openapi({
      description: "RetroAchievements username",
      example: "YourUsername",
    }),
    api_key: z.string().min(1).openapi({
      description: "RetroAchievements API key",
      example: "your-api-key-here",
    }),
  })
  .openapi("RACredentialsRequest", {
    description: "RetroAchievements credentials for validation",
  });

/**
 * RetroAchievements credentials request
 */
export type RACredentialsRequestDto = z.infer<typeof RA_CREDENTIALS_REQUEST_SCHEMA>;

/**
 * Schema for RetroAchievements validation response
 */
export const RA_VALIDATE_RESPONSE_SCHEMA = z
  .object({
    is_valid: z.boolean().openapi({
      description: "Whether credentials are valid",
    }),
    message: z.string().optional().openapi({
      description: "Validation message",
    }),
  })
  .openapi("RAValidateResponse", {
    description: "RetroAchievements credentials validation result",
  });

/**
 * RetroAchievements validation response
 */
export type RAValidateResponseDto = z.infer<typeof RA_VALIDATE_RESPONSE_SCHEMA>;

/**
 * Schema for RetroAchievements sync request
 */
export const RA_SYNC_REQUEST_SCHEMA = z
  .object({
    game_id: z.string().uuid("Invalid game ID").openapi({
      description: "Game ID to sync achievements for",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
  })
  .openapi("RASyncRequest", {
    description: "Request to sync RetroAchievements for a game",
  });

/**
 * RetroAchievements sync request
 */
export type RASyncRequestDto = z.infer<typeof RA_SYNC_REQUEST_SCHEMA>;

/**
 * Schema for RetroAchievements sync response
 */
export const RA_SYNC_RESPONSE_SCHEMA = z
  .object({
    synced: z.number().int().openapi({
      description: "Total achievements synced",
      example: 25,
    }),
    unlocked: z.number().int().openapi({
      description: "Achievements unlocked by user",
      example: 10,
    }),
    total: z.number().int().openapi({
      description: "Total achievements for game",
      example: 25,
    }),
  })
  .openapi("RASyncResponse", {
    description: "RetroAchievements sync result",
  });

/**
 * RetroAchievements sync response
 */
export type RASyncResponseDto = z.infer<typeof RA_SYNC_RESPONSE_SCHEMA>;
