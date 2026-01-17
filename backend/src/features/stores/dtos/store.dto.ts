import { z } from "@hono/zod-openapi";

export const StoreSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Store unique identifier",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
    slug: z.string().openapi({
      description: "URL-friendly store identifier",
      example: "steam",
    }),
    display_name: z.string().openapi({
      description: "Human-readable store name",
      example: "Steam",
    }),
    store_type: z.enum(["digital", "physical"]).openapi({
      description: "Store type classification",
      example: "digital",
    }),
    platform_family: z.string().nullable().openapi({
      description: "Associated platform family",
      example: "PC",
    }),
    color_primary: z.string().openapi({
      description: "Brand color in hex format",
      example: "#171A21",
    }),
    website_url: z.string().url().nullable().openapi({
      description: "Official website URL",
      example: "https://store.steampowered.com",
    }),
    icon_url: z.string().url().nullable().openapi({
      description: "Store icon/logo URL",
      example: "https://example.com/steam-icon.png",
    }),
    supports_achievements: z.boolean().openapi({
      description: "Whether store supports achievement tracking",
      example: true,
    }),
    supports_library_sync: z.boolean().openapi({
      description: "Whether store supports library sync",
      example: true,
    }),
    igdb_website_category: z.number().int().nullable().openapi({
      description: "IGDB website category identifier",
      example: 1,
    }),
    sort_order: z.number().int().openapi({
      description: "Display order in UI lists",
      example: 1,
    }),
    created_at: z.string().datetime().nullable().openapi({
      description: "Creation timestamp",
    }),
  })
  .openapi("Store");

export type StoreDto = z.infer<typeof StoreSchema>;

export const StoreResponseSchema = z
  .object({
    store: StoreSchema,
  })
  .openapi("StoreResponse");

export type StoreResponse = z.infer<typeof StoreResponseSchema>;

export const StoreListResponseSchema = z
  .object({
    stores: z.array(StoreSchema).max(100).openapi({ maxItems: 100 }),
  })
  .openapi("StoreListResponse");

export type StoreListResponse = z.infer<typeof StoreListResponseSchema>;

export const StoreIdParamsSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Store unique identifier",
      example: "550e8400-e29b-41d4-a716-446655440000",
    }),
  })
  .openapi("StoreIdParams");

export type StoreIdParams = z.infer<typeof StoreIdParamsSchema>;
