import { createOpenAI } from "@ai-sdk/openai"
import { createXai } from "@ai-sdk/xai"
import { createProviderRegistry } from "ai"
import type { ProviderRegistryProvider } from "ai"
import type { ProviderV3 } from "@ai-sdk/provider"
import { decrypt } from "@/lib/encryption"
import type { AiSettings } from "./service"

export interface MultiProviderSettings {
  openai?: {
    apiKey: string
    baseUrl?: string
  }
  xai?: {
    apiKey: string
    baseUrl?: string
  }
}

export function createAIProviderRegistry(
  settings: MultiProviderSettings
): ProviderRegistryProvider<Record<string, ProviderV3>, ":"> {
  const providers: Record<string, ProviderV3> = {}

  // Register OpenAI provider if credentials available
  if (settings.openai?.apiKey) {
    providers.openai = createOpenAI({
      apiKey: settings.openai.apiKey,
      baseURL: settings.openai.baseUrl || undefined,
    })
  }

  // Register xAI provider if credentials available
  if (settings.xai?.apiKey) {
    providers.xai = createXai({
      apiKey: settings.xai.apiKey,
      baseURL: settings.xai.baseUrl || undefined,
    })
  }

  if (Object.keys(providers).length === 0) {
    throw new Error("No AI providers configured")
  }

  return createProviderRegistry(providers)
}

export function buildMultiProviderSettings(
  openaiSettings: AiSettings | null,
  xaiSettings: AiSettings | null
): MultiProviderSettings {
  const settings: MultiProviderSettings = {}

  if (openaiSettings?.apiKeyEncrypted) {
    settings.openai = {
      apiKey: decrypt(openaiSettings.apiKeyEncrypted),
      baseUrl: openaiSettings.baseUrl || undefined,
    }
  }

  if (xaiSettings?.xaiApiKeyEncrypted) {
    settings.xai = {
      apiKey: decrypt(xaiSettings.xaiApiKeyEncrypted),
      baseUrl: xaiSettings.xaiBaseUrl || undefined,
    }
  }

  return settings
}
