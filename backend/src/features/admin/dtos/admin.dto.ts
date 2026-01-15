import { z } from "zod";

/**
 * Analytics provider enum values
 */
const ANALYTICS_PROVIDER_VALUES = ["umami", "plausible", "posthog", "google-analytics"] as const;

/**
 * Schema for analytics configuration in request
 */
const AnalyticsConfigRequestSchema = z
  .object({
    enabled: z.boolean().optional(),
    provider: z.enum(ANALYTICS_PROVIDER_VALUES).nullable().optional(),
    key: z.string().max(255).nullable().optional(),
    host: z.string().url().nullable().optional(),
  })
  .strict();

/**
 * Schema for search configuration in request
 */
const SearchConfigRequestSchema = z
  .object({
    server_side: z.boolean().optional(),
    debounce_ms: z.number().int().min(0).max(2000).optional(),
  })
  .strict();

/**
 * Schema for updating admin settings
 */
export const UpdateAdminSettingsRequestSchema = z
  .object({
    analytics: AnalyticsConfigRequestSchema.optional(),
    search: SearchConfigRequestSchema.optional(),
  })
  .strict()
  .refine((data) => data.analytics !== undefined || data.search !== undefined, {
    message: "At least one settings section must be provided",
  })
  .openapi("UpdateAdminSettingsRequest", {
    description: "Request to update admin settings",
    example: {
      analytics: {
        enabled: true,
        provider: "umami",
        key: "abc123",
        host: "https://analytics.example.com",
      },
    },
  });

export type UpdateAdminSettingsRequest = z.infer<typeof UpdateAdminSettingsRequestSchema>;

/**
 * Schema for analytics configuration in response
 */
const AnalyticsConfigResponseSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(ANALYTICS_PROVIDER_VALUES).nullable(),
  key: z.string().nullable(),
  host: z.string().nullable(),
});

/**
 * Schema for search configuration in response
 */
const SearchConfigResponseSchema = z.object({
  server_side: z.boolean(),
  debounce_ms: z.number().int(),
});

/**
 * Schema for admin settings response
 */
export const AdminSettingsResponseSchema = z
  .object({
    analytics: AnalyticsConfigResponseSchema,
    search: SearchConfigResponseSchema,
  })
  .openapi("AdminSettingsResponse", {
    description: "Admin settings",
    example: {
      analytics: {
        enabled: false,
        provider: null,
        key: null,
        host: null,
      },
      search: {
        server_side: true,
        debounce_ms: 300,
      },
    },
  });

export type AdminSettingsResponseDto = z.infer<typeof AdminSettingsResponseSchema>;

/**
 * Schema for get admin settings response (wrapped)
 */
export const GetAdminSettingsResponseSchema = z
  .object({
    settings: AdminSettingsResponseSchema,
  })
  .openapi("GetAdminSettingsResponse", {
    description: "Get admin settings response",
  });

export type GetAdminSettingsResponse = z.infer<typeof GetAdminSettingsResponseSchema>;
