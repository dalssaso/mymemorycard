import { z } from "zod";

/**
 * Shared enum definitions for preferences
 */
const DEFAULT_VIEW_VALUES = ["grid", "table"] as const;
const THEME_VALUES = ["light", "dark", "auto"] as const;

/**
 * Schema for updating user preferences
 */
export const UpdatePreferencesRequestSchema = z
  .object({
    default_view: z.enum(DEFAULT_VIEW_VALUES).optional(),
    items_per_page: z
      .union([z.literal(10), z.literal(25), z.literal(50), z.literal(100)])
      .optional(),
    theme: z.enum(THEME_VALUES).optional(),
  })
  .strict()
  .openapi("UpdatePreferencesRequest", {
    description: "Request to update user preferences",
    example: {
      default_view: "table",
      items_per_page: 50,
      theme: "dark",
    },
  });

export type UpdatePreferencesRequest = z.infer<typeof UpdatePreferencesRequestSchema>;

/**
 * Schema for preferences response
 */
export const PreferencesResponseSchema = z
  .object({
    default_view: z.enum(DEFAULT_VIEW_VALUES),
    items_per_page: z.union([z.literal(10), z.literal(25), z.literal(50), z.literal(100)]),
    theme: z.enum(THEME_VALUES),
    updated_at: z.string().datetime().nullable(),
  })
  .openapi("PreferencesResponse", {
    description: "User preferences",
    example: {
      default_view: "grid",
      items_per_page: 25,
      theme: "dark",
      updated_at: "2026-01-15T10:00:00.000Z",
    },
  });

export type PreferencesResponseDto = z.infer<typeof PreferencesResponseSchema>;

/**
 * Schema for get preferences response (wrapped)
 */
export const GetPreferencesResponseSchema = z
  .object({
    preferences: PreferencesResponseSchema,
  })
  .openapi("GetPreferencesResponse", {
    description: "Get preferences response",
  });

export type GetPreferencesResponse = z.infer<typeof GetPreferencesResponseSchema>;
