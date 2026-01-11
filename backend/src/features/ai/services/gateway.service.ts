import { injectable } from "tsyringe";
import { createOpenAI } from "@ai-sdk/openai";
import { createXai } from "@ai-sdk/xai";
import { embed, generateText, streamText } from "ai";

import type { IGatewayService } from "./gateway.service.interface";
import type { EmbeddingResult, CompletionResult, ImageResult, GatewayConfig } from "../types";
import { AI_MODELS } from "../types";

/**
 * Gateway service for all AI operations.
 * Routes requests through Vercel AI SDK to OpenAI or xAI providers.
 */
@injectable()
export class GatewayService implements IGatewayService {
  async generateEmbedding(text: string, config: GatewayConfig): Promise<EmbeddingResult> {
    const provider = this.createProvider(config);
    const model = provider.embeddingModel(AI_MODELS.EMBEDDING);

    const { embedding, usage } = await embed({
      model,
      value: text,
    });

    return {
      embedding,
      model: AI_MODELS.EMBEDDING,
      tokensUsed: usage?.tokens ?? 0,
    };
  }

  async generateCompletion(
    prompt: string,
    systemPrompt: string,
    config: GatewayConfig
  ): Promise<CompletionResult> {
    const provider = this.createProvider(config);
    const model = provider(AI_MODELS.TEXT);

    const { text, usage } = await generateText({
      model,
      system: systemPrompt,
      prompt,
    });

    return {
      text,
      model: AI_MODELS.TEXT,
      tokensUsed: {
        prompt: usage?.inputTokens ?? 0,
        completion: usage?.outputTokens ?? 0,
        total: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0),
      },
    };
  }

  async *streamCompletion(
    prompt: string,
    systemPrompt: string,
    config: GatewayConfig
  ): AsyncIterable<string> {
    const provider = this.createProvider(config);
    const model = provider(AI_MODELS.TEXT);

    const { textStream } = streamText({
      model,
      system: systemPrompt,
      prompt,
    });

    for await (const chunk of textStream) {
      yield chunk;
    }
  }

  async generateImage(prompt: string, config: GatewayConfig): Promise<ImageResult> {
    // Force xAI for image generation
    const xaiConfig: GatewayConfig = { ...config, provider: "xai" };
    const provider = this.createProvider(xaiConfig);

    // Use xAI's image generation
    const { text } = await generateText({
      model: provider(AI_MODELS.IMAGE),
      prompt: `Generate an image: ${prompt}`,
    });

    return {
      url: text, // xAI returns image URL
      model: AI_MODELS.IMAGE,
    };
  }

  private createProvider(
    config: GatewayConfig
  ): ReturnType<typeof createOpenAI> | ReturnType<typeof createXai> {
    if (config.provider === "xai") {
      return createXai({
        apiKey: config.apiKey,
      });
    }
    return createOpenAI({
      apiKey: config.apiKey,
    });
  }
}
