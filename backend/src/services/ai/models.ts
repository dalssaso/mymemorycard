import type OpenAI from 'openai'

export interface ModelCapability {
  id: string
  name: string
  displayName: string
  pricing: {
    input?: number
    output?: number
    perImage?: number
  }
  capabilities: ('text' | 'image')[]
  provider: string
  context?: number
}

export interface ModelsResponse {
  textModels: ModelCapability[]
  imageModels: ModelCapability[]
}

const OPENAI_TEXT_MODEL_RANKING = ['gpt-5-nano', 'gpt-5-mini', 'gpt-4o-mini', 'gpt-5']

const OPENAI_MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-5': { input: 1.25, output: 10 },
  'gpt-5-mini': { input: 0.25, output: 2 },
  'gpt-5-nano': { input: 0.05, output: 0.4 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 5, output: 15 },
}

const OPENAI_IMAGE_MODELS = ['gpt-image-1.5', 'dall-e-3']

const OPENAI_IMAGE_MODEL_PRICING: Record<string, { perImage: number }> = {
  'gpt-image-1.5': { perImage: 0.04 },
  'dall-e-3': { perImage: 0.04 },
}

export async function discoverOpenAIModels(client: OpenAI): Promise<ModelsResponse> {
  try {
    const response = await client.models.list()
    const availableModels = Array.from(response.data)

    const textModels: ModelCapability[] = []
    const imageModels: ModelCapability[] = []

    for (const modelId of OPENAI_TEXT_MODEL_RANKING) {
      const model = availableModels.find((m) => m.id === modelId)
      if (model) {
        const pricing = OPENAI_MODEL_PRICING[modelId]
        if (pricing) {
          textModels.push({
            id: modelId,
            name: modelId,
            displayName: modelId,
            pricing: {
              input: pricing.input,
              output: pricing.output,
            },
            capabilities: ['text'],
            provider: 'openai',
          })
        }
      }
    }

    for (const modelId of OPENAI_IMAGE_MODELS) {
      const model = availableModels.find((m) => m.id === modelId)
      if (model) {
        const pricing = OPENAI_IMAGE_MODEL_PRICING[modelId]
        if (pricing) {
          imageModels.push({
            id: modelId,
            name: modelId,
            displayName: modelId,
            pricing: {
              perImage: pricing.perImage,
            },
            capabilities: ['image'],
            provider: 'openai',
          })
        }
      }
    }

    return {
      textModels: textModels.slice(0, 5),
      imageModels: imageModels.slice(0, 5),
    }
  } catch (error) {
    console.error('Error discovering OpenAI models:', error)
    return { textModels: [], imageModels: [] }
  }
}

interface OpenRouterModel {
  id: string
  name?: string
  pricing?: {
    prompt?: string
    completion?: string
    image?: string
  }
  context_length?: number
}

const OPENROUTER_TEXT_MODELS = [
  'openai/gpt-5-nano',
  'openai/gpt-5-mini',
  'openai/gpt-4o-mini',
  'deepseek/deepseek-v3.2',
  'allenai/olmo-3.1-32b-think:free',
]

const OPENROUTER_IMAGE_MODELS = [
  'openai/gpt-image-1.5',
  'google/gemini-2.5-flash-image',
  'black-forest-labs/flux-1.1-pro',
  'black-forest-labs/flux-pro',
  'anthropic/claude-3-5-sonnet:beta', // Can generate images via artifacts
]

export async function discoverOpenRouterModels(apiKey: string): Promise<ModelsResponse> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = (await response.json()) as { data: OpenRouterModel[] }
    const models = data.data || []

    const modelsMap = new Map<string, OpenRouterModel>(models.map((m) => [m.id, m]))

    const textModels: ModelCapability[] = []
    const imageModels: ModelCapability[] = []

    for (const modelId of OPENROUTER_TEXT_MODELS) {
      const model = modelsMap.get(modelId)
      if (model) {
        const inputCost = model.pricing?.prompt ? parseFloat(model.pricing.prompt) * 1000000 : 0
        const outputCost = model.pricing?.completion
          ? parseFloat(model.pricing.completion) * 1000000
          : 0

        textModels.push({
          id: model.id,
          name: model.name || model.id,
          displayName: model.name || model.id,
          pricing: {
            input: inputCost,
            output: outputCost,
          },
          capabilities: ['text'],
          provider: 'openrouter',
          context: model.context_length,
        })
      }
    }

    // Debug: Log available image models
    const availableImageModels = models.filter(
      (m) =>
        m.id.includes('image') ||
        m.id.includes('flux') ||
        m.id.includes('dream') ||
        m.id.includes('dall-e')
    )
    console.log(
      'Available OpenRouter image models:',
      availableImageModels.map((m) => m.id)
    )

    for (const modelId of OPENROUTER_IMAGE_MODELS) {
      const model = modelsMap.get(modelId)
      if (model) {
        const perImage = model.pricing?.image
          ? parseFloat(model.pricing.image)
          : model.pricing?.prompt
            ? parseFloat(model.pricing.prompt)
            : 0.01

        imageModels.push({
          id: model.id,
          name: model.name || model.id,
          displayName: model.name || model.id,
          pricing: {
            perImage,
          },
          capabilities: ['image'],
          provider: 'openrouter',
          context: model.context_length,
        })
      } else {
        console.warn(`OpenRouter image model not found in API: ${modelId}`)
      }
    }

    return {
      textModels,
      imageModels,
    }
  } catch (error) {
    console.error('Error discovering OpenRouter models:', error)
    return { textModels: [], imageModels: [] }
  }
}

export async function getModelsForProvider(
  provider: string,
  client?: OpenAI,
  apiKey?: string
): Promise<ModelsResponse> {
  if (provider === 'openai') {
    if (!client) {
      return { textModels: [], imageModels: [] }
    }
    return await discoverOpenAIModels(client)
  }

  if (provider === 'openrouter') {
    if (!apiKey) {
      return { textModels: [], imageModels: [] }
    }
    return await discoverOpenRouterModels(apiKey)
  }

  return { textModels: [], imageModels: [] }
}
