import type { EmbeddingResult, CompletionResult, ImageResult, GatewayConfig } from "../types";

/**
 * Interface for AI Gateway service operations.
 * All AI operations go through the Vercel AI Gateway.
 */
export interface IGatewayService {
  /**
   * Generate embeddings for text using Vercel AI Gateway
   * @param text - The text to generate embeddings for
   * @param config - Gateway configuration including API key and provider
   * @returns Promise resolving to embedding result with vector, model, and token usage
   */
  generateEmbedding(text: string, config: GatewayConfig): Promise<EmbeddingResult>;

  /**
   * Generate text completion using Vercel AI Gateway
   * @param prompt - The user prompt for completion
   * @param systemPrompt - The system prompt to set context
   * @param config - Gateway configuration including API key and provider
   * @returns Promise resolving to completion result with text, model, and token usage
   */
  generateCompletion(
    prompt: string,
    systemPrompt: string,
    config: GatewayConfig
  ): Promise<CompletionResult>;

  /**
   * Stream text completion using Vercel AI Gateway
   * @param prompt - The user prompt for completion
   * @param systemPrompt - The system prompt to set context
   * @param config - Gateway configuration including API key and provider
   * @param signal - Optional AbortSignal to cancel the stream
   * @returns AsyncIterable yielding text chunks as they are generated
   */
  streamCompletion(
    prompt: string,
    systemPrompt: string,
    config: GatewayConfig,
    signal?: AbortSignal
  ): AsyncIterable<string>;

  /**
   * Generate image using xAI via Vercel AI Gateway
   * @param prompt - The image generation prompt
   * @param config - Gateway configuration including API key and provider
   * @returns Promise resolving to image result with URL and model
   */
  generateImage(prompt: string, config: GatewayConfig): Promise<ImageResult>;
}
