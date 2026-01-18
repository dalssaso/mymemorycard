import { z } from "zod";

/**
 * Achievement source API schema
 */
const ACHIEVEMENT_SOURCE_SCHEMA = z.enum(["steam", "retroachievements", "rawg", "manual"]).openapi({
  description: "Source of achievement data",
  example: "steam",
});

/**
 * Single achievement schema for API responses
 */
const ACHIEVEMENT_ITEM_SCHEMA = z
  .object({
    id: z.string().openapi({
      description: "Achievement ID from source",
      example: "ACH_WIN_100_MATCHES",
    }),
    name: z.string().openapi({
      description: "Achievement name",
      example: "Century Victor",
    }),
    description: z.string().openapi({
      description: "Achievement description",
      example: "Win 100 multiplayer matches",
    }),
    icon_url: z.string().url().nullable().openapi({
      description: "Achievement icon URL",
      example: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/570/ach.jpg",
    }),
    rarity_percentage: z.number().min(0).max(100).nullable().openapi({
      description: "Global unlock percentage",
      example: 15.5,
    }),
    points: z.number().int().nullable().openapi({
      description: "Achievement points (RetroAchievements only)",
      example: 10,
    }),
    unlocked: z.boolean().openapi({
      description: "Whether user has unlocked this achievement",
      example: true,
    }),
    unlock_date: z.string().datetime().nullable().openapi({
      description: "ISO 8601 datetime when achievement was unlocked",
      example: "2024-01-15T14:30:00.000Z",
    }),
  })
  .openapi("AchievementItem", {
    description: "Single achievement with unlock status",
  });

/**
 * Schema for achievement response (list of achievements)
 */
export const ACHIEVEMENT_RESPONSE_SCHEMA = z
  .object({
    source: ACHIEVEMENT_SOURCE_SCHEMA,
    achievements: z.array(ACHIEVEMENT_ITEM_SCHEMA).openapi({
      description: "List of achievements",
    }),
    total: z.number().int().openapi({
      description: "Total number of achievements",
      example: 50,
    }),
    unlocked: z.number().int().openapi({
      description: "Number of unlocked achievements",
      example: 25,
    }),
  })
  .openapi("AchievementResponse", {
    description: "Achievement list with source and unlock stats",
  });

/**
 * Achievement response type
 */
export type AchievementResponseDto = z.infer<typeof ACHIEVEMENT_RESPONSE_SCHEMA>;

/**
 * Schema for achievement sync request
 */
export const ACHIEVEMENT_SYNC_REQUEST_SCHEMA = z
  .object({
    game_id: z.string().uuid("Invalid game ID").optional().openapi({
      description: "Game ID to sync achievements for (optional, uses path parameter if omitted)",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
    source: ACHIEVEMENT_SOURCE_SCHEMA.openapi({
      description: "Source API to sync from",
      example: "steam",
    }),
  })
  .openapi("AchievementSyncRequest", {
    description: "Request to sync achievements from a specific source",
  });

/**
 * Achievement sync request type
 */
export type AchievementSyncRequestDto = z.infer<typeof ACHIEVEMENT_SYNC_REQUEST_SCHEMA>;

/**
 * Schema for achievement progress response
 */
export const ACHIEVEMENT_PROGRESS_SCHEMA = z
  .object({
    unlocked: z.number().int().openapi({
      description: "Number of unlocked achievements",
      example: 25,
    }),
    total: z.number().int().openapi({
      description: "Total number of achievements",
      example: 50,
    }),
    percentage: z.number().int().min(0).max(100).openapi({
      description: "Completion percentage (0-100)",
      example: 50,
    }),
  })
  .openapi("AchievementProgress", {
    description: "Achievement progress summary",
  });

/**
 * Achievement progress type
 */
export type AchievementProgressDto = z.infer<typeof ACHIEVEMENT_PROGRESS_SCHEMA>;
