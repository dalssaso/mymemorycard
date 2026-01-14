import { z } from "zod";

export const PlatformSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    display_name: z.string(),
    platform_type: z.enum(["pc", "console", "mobile", "physical"]),
    is_system: z.boolean(),
    is_physical: z.boolean(),
    website_url: z.string().nullable(),
    color_primary: z.string(),
    default_icon_url: z.string().nullable(),
    sort_order: z.number().int(),
  })
  .openapi("Platform");

export const PlatformListResponseSchema = z
  .object({
    platforms: z.array(PlatformSchema).max(100),
  })
  .openapi("PlatformListResponse");

export const PlatformResponseSchema = z
  .object({
    platform: PlatformSchema,
  })
  .openapi("PlatformResponse");

export const PlatformIdParamsSchema = z
  .object({
    id: z.uuid(),
  })
  .openapi("PlatformIdParams");

export type PlatformIdParams = z.infer<typeof PlatformIdParamsSchema>;
export type PlatformResponse = z.infer<typeof PlatformResponseSchema>;
export type PlatformListResponse = z.infer<typeof PlatformListResponseSchema>;
