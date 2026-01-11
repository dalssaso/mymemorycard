import { z } from "zod";

export const GenerateEmbeddingRequestSchema = z.object({
  gameId: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      "Must be a valid UUID v4"
    ),
  text: z.string().min(1),
});

export const SuggestCollectionsRequestSchema = z.object({
  gameIds: z
    .array(
      z
        .string()
        .regex(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
          "Must be a valid UUID v4"
        )
    )
    .min(1)
    .max(100),
});

export const SuggestNextGameRequestSchema = z.object({
  recentGameIds: z
    .array(
      z
        .string()
        .regex(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
          "Must be a valid UUID v4"
        )
    )
    .min(1)
    .max(20),
});

export const GenerateCoverRequestSchema = z.object({
  collectionName: z.string().min(1),
  gameNames: z.array(z.string().min(1)).min(1).max(10),
});

// Response schemas
export const CollectionSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  gameIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const NextGameSuggestionSchema = z.object({
  gameId: z.string(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
});
