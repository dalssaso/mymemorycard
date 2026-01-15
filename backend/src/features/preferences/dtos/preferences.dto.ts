import { z } from "zod";

/**
 * Shared enum definitions for preferences
 */
const DEFAULT_VIEW_VALUES = ["grid", "table"] as const;
const ITEMS_PER_PAGE_VALUES = [10, 25, 50, 100] as const;
const THEME_VALUES = ["light", "dark", "auto"] as const;

/**
 * Shared schema for items_per_page with OpenAPI numeric enum
 */
const ITEMS_PER_PAGE_SCHEMA = z
  .union([z.literal(10), z.literal(25), z.literal(50), z.literal(100)])
  .openapi({ type: "integer", enum: [...ITEMS_PER_PAGE_VALUES] });

/**
 * Schema for updating user preferences
 */
export const UpdatePreferencesRequestSchema = z
  .object({
    default_view: z.enum(DEFAULT_VIEW_VALUES).optional(),
    items_per_page: ITEMS_PER_PAGE_SCHEMA.optional(),
    theme: z.enum(THEME_VALUES).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.default_view !== undefined ||
      data.items_per_page !== undefined ||
      data.theme !== undefined,
    { message: "At least one preference field must be provided" }
  )
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
    items_per_page: ITEMS_PER_PAGE_SCHEMA,
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
