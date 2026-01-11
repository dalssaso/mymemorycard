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
  /**
   * Generates embeddings for text using Vercel AI Gateway.
   *
   * Always uses OpenAI provider regardless of config, as xAI does not support embeddings.
   * Uses the text-embedding-ada-002 model for consistent vector dimensions.
   *
   * @param text - The text to generate embeddings for
   * @param config - Gateway configuration including API key and provider
   * @returns Promise resolving to embedding result with vector, model, and token usage
   */
  async generateEmbedding(text: string, config: GatewayConfig): Promise<EmbeddingResult> {
    // Force OpenAI for embeddings (xAI doesn't support embeddings)
    const openaiConfig: GatewayConfig = { ...config, provider: "openai" };
    const provider = this.createProvider(openaiConfig) as ReturnType<typeof createOpenAI>;
    const model = provider.embedding(AI_MODELS.EMBEDDING);

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

  /**
   * Generates text completion using Vercel AI Gateway.
   *
   * Supports both OpenAI and xAI providers. Uses the configured provider's
   * text generation model (gpt-4o or grok-beta).
   *
   * @param prompt - The user prompt for completion
   * @param systemPrompt - The system prompt to set context
   * @param config - Gateway configuration including API key and provider
   * @returns Promise resolving to completion result with text, model, and token usage
   */
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

  /**
   * Streams text completion using Vercel AI Gateway.
   *
   * Supports both OpenAI and xAI providers. Yields text chunks as they are generated
   * for real-time streaming responses. The stream can be aborted using the AbortSignal.
   *
   * @param prompt - The user prompt for completion
   * @param systemPrompt - The system prompt to set context
   * @param config - Gateway configuration including API key and provider
   * @param signal - Optional AbortSignal to cancel the stream
   * @returns AsyncIterable yielding text chunks as they are generated
   * @throws {Error} If the request is aborted or streaming fails
   */
  async *streamCompletion(
    prompt: string,
    systemPrompt: string,
    config: GatewayConfig,
    signal?: AbortSignal
  ): AsyncIterable<string> {
    try {
      if (signal?.aborted) {
        throw new Error("Request was aborted before streaming started");
      }

      const provider = this.createProvider(config);
      const model = provider(AI_MODELS.TEXT);

      const { textStream } = streamText({
        model,
        system: systemPrompt,
        prompt,
        abortSignal: signal,
      });

      for await (const chunk of textStream) {
        if (signal?.aborted) {
          throw new Error("Stream was aborted");
        }
        yield chunk;
      }
    } catch (error) {
      if (signal?.aborted) {
        throw new Error("Stream cancelled by client");
      }
      throw new Error(
        `Streaming failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generates image using xAI via Vercel AI Gateway.
   *
   * Always uses xAI provider regardless of config, as it's the only provider
   * that supports image generation in the current setup. Uses the grok-2-vision-1212
   * model.
   *
   * @param prompt - The image generation prompt
   * @param config - Gateway configuration including API key and provider
   * @returns Promise resolving to image result with URL and model
   */
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
