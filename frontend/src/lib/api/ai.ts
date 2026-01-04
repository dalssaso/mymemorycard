import { api } from "./axios"

export interface AiProviderConfig {
  provider: string
  base_url: string | null
  api_key_masked?: string | null
  model: string
  image_api_key_masked?: string | null
  image_model: string | null
  temperature: number
  max_tokens: number
  is_active: boolean
}

export interface CollectionSuggestion {
  name: string
  description: string
  gameNames: string[]
  gameIds: string[]
  reasoning: string
}

export interface NextGameSuggestion {
  gameName: string
  reasoning: string
  estimatedHours?: number | null
}

export interface AiActivityLog {
  id: string
  actionType: string
  provider: string
  model: string
  success: boolean
  estimatedCostUsd: number | null
  durationMs: number | null
  createdAt: string
}

export interface ModelCapability {
  id: string
  name: string
  displayName: string
  pricing: {
    input?: number
    output?: number
    perImage?: number
  }
  capabilities: ("text" | "image")[]
  provider: string
  context?: number
}

export interface ModelsResponse {
  textModels: ModelCapability[]
  imageModels: ModelCapability[]
}

export const aiAPI = {
  getSettings: () =>
    api.get<{ providers: AiProviderConfig[]; activeProvider: AiProviderConfig | null }>(
      "/ai/settings"
    ),
  updateSettings: (data: {
    provider: string
    baseUrl?: string | null
    apiKey?: string | null
    model?: string
    imageApiKey?: string | null
    imageModel?: string | null
    temperature?: number
    maxTokens?: number
    setActive?: boolean
  }) => api.put("/ai/settings", data),
  setActiveProvider: (provider: string) => api.post("/ai/set-active-provider", { provider }),
  getModels: (provider: string) => api.get<ModelsResponse>(`/ai/models/${provider}`),
  suggestCollections: (theme?: string) =>
    api.post<{ collections: CollectionSuggestion[]; cost: number }>(
      "/ai/suggest-collections",
      { theme },
      {
        timeout: 120000,
      }
    ),
  suggestNextGame: (userInput?: string) =>
    api.post<{ suggestion: NextGameSuggestion; cost: number }>(
      "/ai/suggest-next-game",
      { userInput },
      {
        timeout: 120000,
      }
    ),
  generateCover: (collectionName: string, collectionDescription: string, collectionId: string) =>
    api.post<{ imageUrl: string; cost: number }>(
      "/ai/generate-cover",
      {
        collectionName,
        collectionDescription,
        collectionId,
      },
      {
        timeout: 180000,
      }
    ),
  getActivity: (limit?: number) =>
    api.get<{ logs: AiActivityLog[] }>("/ai/activity", { params: { limit } }),
  estimateCost: (actionType: string) =>
    api.post<{ estimatedCostUsd: number }>("/ai/estimate-cost", { actionType }),
}
