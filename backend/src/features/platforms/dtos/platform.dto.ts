import { z } from "@hono/zod-openapi";

export const PlatformSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Platform unique identifier",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
    igdb_platform_id: z.number().int().nullable().openapi({
      description: "IGDB platform identifier",
      example: 6,
    }),
    name: z.string().openapi({
      description: "Platform name",
      example: "PC (Windows)",
    }),
    abbreviation: z.string().nullable().openapi({
      description: "Platform abbreviation",
      example: "PC",
    }),
    slug: z.string().nullable().openapi({
      description: "URL-friendly platform identifier",
      example: "win",
    }),
    platform_family: z.string().nullable().openapi({
      description: "Platform family grouping",
      example: "PC",
    }),
    color_primary: z.string().openapi({
      description: "Brand color in hex format",
      example: "#6B7280",
    }),
    created_at: z.string().datetime().nullable().openapi({
      description: "Creation timestamp",
    }),
  })
  .openapi("Platform");

export type PlatformDto = z.infer<typeof PlatformSchema>;

export const PlatformResponseSchema = z
  .object({
    platform: PlatformSchema,
  })
  .openapi("PlatformResponse");

export type PlatformResponse = z.infer<typeof PlatformResponseSchema>;

export const PlatformListResponseSchema = z
  .object({
    platforms: z.array(PlatformSchema).max(500).openapi({ maxItems: 500 }),
  })
  .openapi("PlatformListResponse");

export type PlatformListResponse = z.infer<typeof PlatformListResponseSchema>;

export const PlatformIdParamsSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Platform unique identifier",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
  })
  .openapi("PlatformIdParams");

export type PlatformIdParams = z.infer<typeof PlatformIdParamsSchema>;
