import "reflect-metadata";
import { describe, it, expect, beforeEach, mock } from "bun:test";
import { GatewayService } from "@/features/ai/services/gateway.service";
import type { GatewayConfig } from "@/features/ai/types";

// Mock the AI SDK modules
const mockEmbed = mock(
  async (): Promise<{
    embedding: number[];
    usage?: { tokens: number };
  }> => ({
    embedding: [0.1, 0.2, 0.3],
    usage: { tokens: 10 },
  })
);

const mockGenerateText = mock(
  async (): Promise<{
    text: string;
    usage?: {
      inputTokens: number;
      outputTokens: number;
    };
  }> => ({
    text: "Generated completion text",
    usage: {
      inputTokens: 15,
      outputTokens: 25,
    },
  })
);

const mockStreamText = mock(() => ({
  textStream: (async function* (): AsyncGenerator<string> {
    yield "chunk1";
    yield "chunk2";
    yield "chunk3";
  })(),
}));

// Mock the module imports
mock.module("ai", () => ({
  embed: mockEmbed,
  generateText: mockGenerateText,
  streamText: mockStreamText,
}));

mock.module("@ai-sdk/openai", () => ({
  createOpenAI: mock(() => {
    const provider = Object.assign(
      mock(() => "mocked-text-model"), // Can be called as function
      {
        embeddingModel: mock(() => "mocked-embedding-model"), // Has embeddingModel method
      }
    );
    return provider;
  }),
}));

mock.module("@ai-sdk/xai", () => ({
  createXai: mock(() => {
    const provider = Object.assign(
      mock(() => "mocked-xai-text-model"), // Can be called as function
      {
        embeddingModel: mock(() => "mocked-xai-embedding-model"), // Has embeddingModel method
      }
    );
    return provider;
  }),
}));

describe("GatewayService", () => {
  let gatewayService: GatewayService;
  let openaiConfig: GatewayConfig;
  let xaiConfig: GatewayConfig;

  beforeEach(() => {
    gatewayService = new GatewayService();
    openaiConfig = {
      provider: "openai",
      apiKey: "test-openai-key",
    };
    xaiConfig = {
      provider: "xai",
      apiKey: "test-xai-key",
    };

    // Reset mocks
    mockEmbed.mockClear();
    mockGenerateText.mockClear();
    mockStreamText.mockClear();
  });

  describe("generateEmbedding", () => {
    it("should generate embedding using OpenAI provider", async () => {
      const result = await gatewayService.generateEmbedding("test text", openaiConfig);

      expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
      expect(result.model).toBe("text-embedding-3-small");
      expect(result.tokensUsed).toBe(10);
      expect(mockEmbed).toHaveBeenCalledTimes(1);
    });

    it("should generate embedding using xAI provider", async () => {
      const result = await gatewayService.generateEmbedding("test text", xaiConfig);

      expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
      expect(result.model).toBe("text-embedding-3-small");
      expect(result.tokensUsed).toBe(10);
      expect(mockEmbed).toHaveBeenCalled();
    });

    it("should handle missing token usage", async () => {
      mockEmbed.mockResolvedValueOnce({
        embedding: [0.1, 0.2],
      });

      const result = await gatewayService.generateEmbedding("test text", openaiConfig);

      expect(result.tokensUsed).toBe(0);
    });
  });

  describe("generateCompletion", () => {
    it("should generate completion using OpenAI provider", async () => {
      const result = await gatewayService.generateCompletion(
        "test prompt",
        "system prompt",
        openaiConfig
      );

      expect(result.text).toBe("Generated completion text");
      expect(result.model).toBe("gpt-4o-mini");
      expect(result.tokensUsed.prompt).toBe(15);
      expect(result.tokensUsed.completion).toBe(25);
      expect(result.tokensUsed.total).toBe(40);
      expect(mockGenerateText).toHaveBeenCalledTimes(1);
    });

    it("should generate completion using xAI provider", async () => {
      const result = await gatewayService.generateCompletion(
        "test prompt",
        "system prompt",
        xaiConfig
      );

      expect(result.text).toBe("Generated completion text");
      expect(result.model).toBe("gpt-4o-mini");
      expect(result.tokensUsed.total).toBe(40);
      expect(mockGenerateText).toHaveBeenCalled();
    });

    it("should handle missing token usage in completion", async () => {
      mockGenerateText.mockResolvedValueOnce({
        text: "Generated text",
      });

      const result = await gatewayService.generateCompletion(
        "test prompt",
        "system prompt",
        openaiConfig
      );

      expect(result.tokensUsed.prompt).toBe(0);
      expect(result.tokensUsed.completion).toBe(0);
      expect(result.tokensUsed.total).toBe(0);
    });
  });

  describe("streamCompletion", () => {
    it("should stream completion chunks using OpenAI provider", async () => {
      const chunks: string[] = [];

      for await (const chunk of gatewayService.streamCompletion(
        "test prompt",
        "system prompt",
        openaiConfig
      )) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(["chunk1", "chunk2", "chunk3"]);
      expect(mockStreamText).toHaveBeenCalledTimes(1);
    });

    it("should stream completion chunks using xAI provider", async () => {
      const chunks: string[] = [];

      for await (const chunk of gatewayService.streamCompletion(
        "test prompt",
        "system prompt",
        xaiConfig
      )) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(["chunk1", "chunk2", "chunk3"]);
      expect(mockStreamText).toHaveBeenCalled();
    });
  });

  describe("generateImage", () => {
    it("should generate image using xAI provider regardless of config", async () => {
      mockGenerateText.mockResolvedValueOnce({
        text: "https://example.com/image.png",
      });

      const result = await gatewayService.generateImage("test image prompt", openaiConfig);

      expect(result.url).toBe("https://example.com/image.png");
      expect(result.model).toBe("grok-2-image");
    });

    it("should use xAI provider when xAI config is provided", async () => {
      mockGenerateText.mockResolvedValueOnce({
        text: "https://example.com/generated.png",
      });

      const result = await gatewayService.generateImage("test image prompt", xaiConfig);

      expect(result.url).toBe("https://example.com/generated.png");
      expect(result.model).toBe("grok-2-image");
    });
  });
});
