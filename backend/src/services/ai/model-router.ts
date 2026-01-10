import type { AiSettings } from "./service"

export type TaskType = "suggest_collections" | "suggest_next_game" | "generate_cover_image"

export interface ModelRoute {
  primary: string
  fallback: string[]
  maxTokensRecommended: number
  temperatureRecommended: number | null
}

export interface ModelSelection {
  model: string
  maxTokens: number
  temperature: number | null
  isReasoningModel: boolean
}

const MODEL_ROUTES: Record<TaskType, ModelRoute> = {
  suggest_collections: {
    primary: "gpt-5-nano",
    fallback: ["gpt-4o-mini", "gpt-5-mini"],
    maxTokensRecommended: 8000,
    temperatureRecommended: null, // Reasoning models don't support temperature
  },
  suggest_next_game: {
    primary: "gpt-4o-mini",
    fallback: ["gpt-5-nano", "gpt-5-mini"],
    maxTokensRecommended: 4000,
    temperatureRecommended: 0.7,
  },
  generate_cover_image: {
    primary: "grok-2-image-1212",
    fallback: ["gpt-image-1.5", "dall-e-3"],
    maxTokensRecommended: 0,
    temperatureRecommended: null,
  },
}

function isReasoningModel(model: string): boolean {
  return model.startsWith("gpt-5") || model.includes("o1") || model.includes("o3")
}

export async function selectModelForTask(
  taskType: TaskType,
  userSettings: AiSettings,
  availableModels: string[]
): Promise<ModelSelection> {
  // Early validation: if availableModels is empty, fall back to user's default model
  // This ensures the function always returns a valid model selection
  const route = MODEL_ROUTES[taskType]

  // Check user override based on task type
  let userOverride: string | null | undefined
  if (taskType === "suggest_collections") {
    userOverride = userSettings.collectionSuggestionsModel
  } else if (taskType === "suggest_next_game") {
    userOverride = userSettings.nextGameSuggestionsModel
  } else if (taskType === "generate_cover_image") {
    userOverride = userSettings.coverGenerationModel
  }

  if (userOverride) {
    return {
      model: userOverride,
      maxTokens: route.maxTokensRecommended ?? userSettings.maxTokens,
      temperature: isReasoningModel(userOverride)
        ? null
        : (route.temperatureRecommended ?? userSettings.temperature),
      isReasoningModel: isReasoningModel(userOverride),
    }
  }

  // Smart routing enabled: use recommended model
  if (userSettings.enableSmartRouting !== false) {
    // Try primary model
    if (availableModels.includes(route.primary)) {
      return {
        model: route.primary,
        maxTokens: route.maxTokensRecommended ?? userSettings.maxTokens,
        temperature: route.temperatureRecommended ?? userSettings.temperature,
        isReasoningModel: isReasoningModel(route.primary),
      }
    }

    // Try fallbacks
    for (const fallback of route.fallback) {
      if (availableModels.includes(fallback)) {
        return {
          model: fallback,
          maxTokens: route.maxTokensRecommended ?? userSettings.maxTokens,
          temperature: route.temperatureRecommended ?? userSettings.temperature,
          isReasoningModel: isReasoningModel(fallback),
        }
      }
    }
  }

  // Use user's default model
  return {
    model: userSettings.model,
    maxTokens: userSettings.maxTokens,
    temperature: userSettings.temperature,
    isReasoningModel: isReasoningModel(userSettings.model),
  }
}
