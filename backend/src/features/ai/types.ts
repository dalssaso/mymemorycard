import type { InferSelectModel } from "drizzle-orm"

import type {
  userAiSettings,
  gameEmbeddings,
  collectionEmbeddings,
  achievementEmbeddings,
  userPreferenceEmbeddings,
  aiActivityLogs,
} from "@/db/schema"

// ============================================================================
// DATABASE TYPES
// ============================================================================

export type UserAiSettings = InferSelectModel<typeof userAiSettings>
export type GameEmbedding = InferSelectModel<typeof gameEmbeddings>
export type CollectionEmbedding = InferSelectModel<typeof collectionEmbeddings>
export type AchievementEmbedding = InferSelectModel<typeof achievementEmbeddings>
export type UserPreferenceEmbedding = InferSelectModel<typeof userPreferenceEmbeddings>
export type AiActivityLog = InferSelectModel<typeof aiActivityLogs>

// ============================================================================
// GATEWAY CONFIGURATION
// ============================================================================

export interface GatewayConfig {
  apiKey: string
  provider: "openai" | "xai"
}

// ============================================================================
// MODEL CONFIGURATION
// ============================================================================

export const AI_MODELS = {
  TEXT: "gpt-4o-mini",
  EMBEDDING: "text-embedding-3-small",
  IMAGE: "grok-2-image", // xAI image model
} as const

export const EMBEDDING_DIMENSIONS = 1536

// ============================================================================
// SERVICE RESULT TYPES
// ============================================================================

export interface EmbeddingResult {
  embedding: number[]
  model: string
  tokensUsed: number
}

export interface CompletionResult {
  text: string
  model: string
  tokensUsed: {
    prompt: number
    completion: number
    total: number
  }
}

export interface ImageResult {
  url: string
  model: string
}

// ============================================================================
// CURATOR TYPES
// ============================================================================

export interface CollectionSuggestion {
  name: string
  description: string
  gameIds: string[]
  confidence: number
}

export interface NextGameSuggestion {
  gameId: string
  reason: string
  confidence: number
}

// ============================================================================
// AI ACTION TYPES
// ============================================================================

export type AiActionType = "suggest_collections" | "suggest_next_game" | "generate_cover_image"

export type AiProvider = "openai" | "xai"
