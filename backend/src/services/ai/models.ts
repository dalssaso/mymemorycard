import type OpenAI from "openai";

export interface ModelCapability {
  id: string;
  name: string;
  displayName: string;
  pricing: {
    input?: number;
    output?: number;
    perImage?: number;
  };
  capabilities: ("text" | "image")[];
  provider: string;
  context?: number;
}

export interface ModelsResponse {
  textModels: ModelCapability[];
  imageModels: ModelCapability[];
}

const OPENAI_TEXT_MODEL_RANKING = ["gpt-5-nano", "gpt-5-mini", "gpt-4o-mini", "gpt-5"];

const OPENAI_MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-5": { input: 1.25, output: 10 },
  "gpt-5-mini": { input: 0.25, output: 2 },
  "gpt-5-nano": { input: 0.05, output: 0.4 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 5, output: 15 },
};

const OPENAI_IMAGE_MODELS = ["gpt-image-1.5", "dall-e-3"];

const OPENAI_IMAGE_MODEL_PRICING: Record<string, { perImage: number }> = {
  "gpt-image-1.5": { perImage: 0.04 },
  "dall-e-3": { perImage: 0.04 },
};

export async function discoverOpenAIModels(client: OpenAI): Promise<ModelsResponse> {
  try {
    const response = await client.models.list();
    const availableModels = Array.from(response.data);

    const textModels: ModelCapability[] = [];
    const imageModels: ModelCapability[] = [];

    for (const modelId of OPENAI_TEXT_MODEL_RANKING) {
      const model = availableModels.find((m) => m.id === modelId);
      if (model) {
        const pricing = OPENAI_MODEL_PRICING[modelId];
        if (pricing) {
          textModels.push({
            id: modelId,
            name: modelId,
            displayName: modelId,
            pricing: {
              input: pricing.input,
              output: pricing.output,
            },
            capabilities: ["text"],
            provider: "openai",
          });
        }
      }
    }

    for (const modelId of OPENAI_IMAGE_MODELS) {
      const model = availableModels.find((m) => m.id === modelId);
      if (model) {
        const pricing = OPENAI_IMAGE_MODEL_PRICING[modelId];
        if (pricing) {
          imageModels.push({
            id: modelId,
            name: modelId,
            displayName: modelId,
            pricing: {
              perImage: pricing.perImage,
            },
            capabilities: ["image"],
            provider: "openai",
          });
        }
      }
    }

    return {
      textModels: textModels.slice(0, 5),
      imageModels: imageModels.slice(0, 5),
    };
  } catch (error) {
    console.error("Error discovering OpenAI models:", error);
    return { textModels: [], imageModels: [] };
  }
}

export async function getModelsForProvider(
  provider: string,
  client?: OpenAI
): Promise<ModelsResponse> {
  if (provider !== "openai") {
    throw new Error("Only OpenAI provider is supported");
  }

  if (!client) {
    throw new Error("OpenAI client is required");
  }

  return await discoverOpenAIModels(client);
}
