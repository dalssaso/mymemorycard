import { z } from "zod";

/**
 * Valid game statuses
 */
export const GAME_STATUSES = ["backlog", "playing", "finished", "dropped", "completed"] as const;

/**
 * Game status type
 */
export type GameStatus = (typeof GAME_STATUSES)[number];

/**
 * Schema for game progress path parameters (game_id and platform_id)
 */
export const GAME_PROGRESS_PARAMS_SCHEMA = z
  .object({
    game_id: z.string().uuid("Invalid game ID"),
    platform_id: z.string().uuid("Invalid platform ID"),
  })
  .openapi("GameProgressParams", {
    description: "Path parameters for game progress endpoints",
    example: {
      game_id: "550e8400-e29b-41d4-a716-446655440000",
      platform_id: "550e8400-e29b-41d4-a716-446655440001",
    },
  });

/**
 * Game progress path parameters
 */
export type GameProgressParamsDto = z.infer<typeof GAME_PROGRESS_PARAMS_SCHEMA>;

/**
 * Schema for updating game status
 */
export const UPDATE_STATUS_REQUEST_SCHEMA = z
  .object({
    status: z.enum(GAME_STATUSES),
  })
  .strict()
  .openapi("UpdateStatusRequest", {
    description: "Request to update game status",
    example: {
      status: "playing",
    },
  });

/**
 * Update status request
 */
export type UpdateStatusRequestDto = z.infer<typeof UPDATE_STATUS_REQUEST_SCHEMA>;

/**
 * Schema for updating game rating
 */
export const UPDATE_RATING_REQUEST_SCHEMA = z
  .object({
    rating: z
      .number()
      .int("Rating must be an integer")
      .min(1, "Rating must be at least 1")
      .max(10, "Rating cannot exceed 10"),
  })
  .strict()
  .openapi("UpdateRatingRequest", {
    description: "Request to update game rating (1-10 scale)",
    example: {
      rating: 8,
    },
  });

/**
 * Update rating request
 */
export type UpdateRatingRequestDto = z.infer<typeof UPDATE_RATING_REQUEST_SCHEMA>;

/**
 * Schema for updating game notes
 */
export const UPDATE_NOTES_REQUEST_SCHEMA = z
  .object({
    notes: z.string().max(10000, "Notes cannot exceed 10000 characters"),
  })
  .strict()
  .openapi("UpdateNotesRequest", {
    description: "Request to update game notes",
    example: {
      notes: "Great game, completed the main story. Still need to finish the DLC.",
    },
  });

/**
 * Update notes request
 */
export type UpdateNotesRequestDto = z.infer<typeof UPDATE_NOTES_REQUEST_SCHEMA>;

/**
 * Schema for updating game favorite status
 */
export const UPDATE_FAVORITE_REQUEST_SCHEMA = z
  .object({
    is_favorite: z.boolean(),
  })
  .strict()
  .openapi("UpdateFavoriteRequest", {
    description: "Request to update game favorite status",
    example: {
      is_favorite: true,
    },
  });

/**
 * Update favorite request
 */
export type UpdateFavoriteRequestDto = z.infer<typeof UPDATE_FAVORITE_REQUEST_SCHEMA>;

/**
 * Schema for updating custom fields (completion percentage, difficulty rating)
 */
export const UPDATE_CUSTOM_FIELDS_REQUEST_SCHEMA = z
  .object({
    platform_id: z.string().uuid("Invalid platform ID"),
    completion_percentage: z
      .number()
      .min(0, "Completion percentage must be at least 0")
      .max(100, "Completion percentage cannot exceed 100")
      .optional(),
    difficulty_rating: z
      .number()
      .int("Difficulty rating must be an integer")
      .min(1, "Difficulty rating must be at least 1")
      .max(10, "Difficulty rating cannot exceed 10")
      .optional(),
  })
  .strict()
  .refine(
    (data) => data.completion_percentage !== undefined || data.difficulty_rating !== undefined,
    {
      message: "At least one field must be provided",
    }
  )
  .openapi("UpdateCustomFieldsRequest", {
    description: "Request to update custom progress fields",
    example: {
      platform_id: "550e8400-e29b-41d4-a716-446655440001",
      completion_percentage: 75.5,
      difficulty_rating: 7,
    },
  });

/**
 * Update custom fields request
 */
export type UpdateCustomFieldsRequestDto = z.infer<typeof UPDATE_CUSTOM_FIELDS_REQUEST_SCHEMA>;

/**
 * Schema for updating custom fields body (without platform_id since it's in path)
 */
export const UPDATE_CUSTOM_FIELDS_BODY_SCHEMA = z
  .object({
    completion_percentage: z
      .number()
      .min(0, "Completion percentage must be at least 0")
      .max(100, "Completion percentage cannot exceed 100")
      .optional(),
    difficulty_rating: z
      .number()
      .int("Difficulty rating must be an integer")
      .min(1, "Difficulty rating must be at least 1")
      .max(10, "Difficulty rating cannot exceed 10")
      .optional(),
  })
  .strict()
  .refine(
    (data) => data.completion_percentage !== undefined || data.difficulty_rating !== undefined,
    {
      message: "At least one field must be provided",
    }
  )
  .openapi("UpdateCustomFieldsBody", {
    description: "Request body for updating custom progress fields",
    example: {
      completion_percentage: 75.5,
      difficulty_rating: 7,
    },
  });

/**
 * Update custom fields body
 */
export type UpdateCustomFieldsBodyDto = z.infer<typeof UPDATE_CUSTOM_FIELDS_BODY_SCHEMA>;

/**
 * Schema for custom fields response
 */
export const CUSTOM_FIELDS_RESPONSE_SCHEMA = z
  .object({
    custom_fields: z
      .object({
        completion_percentage: z.number().min(0).max(100).nullable().openapi({
          description: "Completion percentage (0-100)",
          example: 75.5,
        }),
        difficulty_rating: z.number().int().min(1).max(10).nullable().openapi({
          description: "User-defined difficulty rating (1-10)",
          example: 7,
        }),
      })
      .openapi({
        description: "Custom progress fields",
      }),
  })
  .openapi("CustomFieldsResponse", {
    description: "Response containing custom progress fields",
  });

/**
 * Custom fields response
 */
export type CustomFieldsResponseDto = z.infer<typeof CUSTOM_FIELDS_RESPONSE_SCHEMA>;

/**
 * Schema for progress update response
 */
export const PROGRESS_UPDATE_RESPONSE_SCHEMA = z
  .object({
    success: z.boolean().openapi({
      description: "Whether the update was successful",
      example: true,
    }),
  })
  .openapi("ProgressUpdateResponse", {
    description: "Response for progress update operations",
  });

/**
 * Progress update response
 */
export type ProgressUpdateResponseDto = z.infer<typeof PROGRESS_UPDATE_RESPONSE_SCHEMA>;
