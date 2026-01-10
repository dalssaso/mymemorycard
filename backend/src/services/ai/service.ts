import { generateText, generateImage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { queryOne, queryMany, query } from "@/services/db";
import { decrypt } from "@/lib/encryption";
import { getCachedLibrary, setCachedLibrary } from "./cache";
import {
  SYSTEM_PROMPTS,
  buildCoverImagePrompt,
  buildCollectionSuggestionsPromptWithRAG,
  buildNextGamePromptWithRAG,
  type GameSummary,
  type CollectionSuggestion,
  type NextGameSuggestion,
} from "./prompts";
import { searchSimilarGames } from "./vector-search";
import { smartSampleGames } from "./game-selection";
import { shouldRegeneratePreferences, generatePreferenceEmbeddings } from "./preference-learning";
import { checkUserHasEmbeddings, generateUserLibraryEmbeddings } from "./embedding-jobs";
import { selectModelForTask } from "./model-router";
import { discoverOpenAIModels } from "./models";
import {
  createAIProviderRegistry,
  buildMultiProviderSettings,
  type MultiProviderSettings,
} from "./provider-registry";

export interface AiSettings {
  provider: string;
  baseUrl: string | null;
  apiKeyEncrypted: string | null;
  model: string;
  imageApiKeyEncrypted: string | null;
  imageModel: string | null;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  collectionSuggestionsModel?: string | null;
  nextGameSuggestionsModel?: string | null;
  coverGenerationModel?: string | null;
  enableSmartRouting?: boolean | null;
  gatewayApiKeyEncrypted?: string | null;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

const MODEL_COSTS = {
  "gpt-5": { input: 1.25, output: 10 },
  "gpt-5-mini": { input: 0.25, output: 2 },
  "gpt-5-nano": { input: 0.05, output: 0.4 },
  "gpt-4.1-mini": { input: 0.003, output: 0.012 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 5, output: 15 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "dall-e-3": { perImage: 0.04 },
  "dall-e-2": { perImage: 0.02 },
  "gpt-image-1.5": { perImage: 0.04 },
  "openai/gpt-image-1.5": { perImage: 0.04 },
  "grok-2-image-1212": { perImage: 0.07 },
  "google/gemini-2.5-flash-image": { perImage: 0.00003 },
  "black-forest-labs/flux.2-max": { perImage: 0.04 },
  "bytedance-seed/seedream-4.5": { perImage: 0.04 },
  default: { input: 0.001, output: 0.002 },
};

function calculateCost(model: string, usage: TokenUsage): number {
  const costs = MODEL_COSTS[model as keyof typeof MODEL_COSTS] || MODEL_COSTS.default;
  if ("perImage" in costs) {
    return costs.perImage;
  }
  return (usage.promptTokens * costs.input + usage.completionTokens * costs.output) / 1000;
}

function addProviderPrefix(model: string): `${string}:${string}` {
  // xAI models
  if (model.startsWith("grok-")) {
    return `xai:${model}`;
  }
  // OpenAI models (default)
  return `openai:${model}`;
}

function getProviderFromModel(model: string): "openai" | "xai" {
  return model.startsWith("grok-") ? "xai" : "openai";
}

export async function getUserAiSettings(userId: string): Promise<AiSettings | null> {
  const settings = await queryOne<AiSettings>(
    `SELECT
      provider,
      base_url as "baseUrl",
      api_key_encrypted as "apiKeyEncrypted",
      model,
      image_api_key_encrypted as "imageApiKeyEncrypted",
      image_model as "imageModel",
      temperature,
      max_tokens as "maxTokens",
      is_active as "enabled",
      collection_suggestions_model as "collectionSuggestionsModel",
      next_game_suggestions_model as "nextGameSuggestionsModel",
      cover_generation_model as "coverGenerationModel",
      enable_smart_routing as "enableSmartRouting",
      gateway_api_key_encrypted as "gatewayApiKeyEncrypted"
    FROM user_ai_settings
    WHERE user_id = $1 AND is_active = true`,
    [userId]
  );
  return settings;
}

async function getAllUserProviderSettings(
  userId: string
): Promise<{ openai: AiSettings | null; xai: AiSettings | null }> {
  const [openaiSettings, xaiSettings] = await Promise.all([
    queryOne<AiSettings>(
      `SELECT * FROM user_ai_settings WHERE user_id = $1 AND provider = 'openai'::ai_provider AND is_active = true`,
      [userId]
    ),
    queryOne<AiSettings>(
      `SELECT * FROM user_ai_settings WHERE user_id = $1 AND provider = 'xai'::ai_provider AND is_active = true`,
      [userId]
    ),
  ]);

  return {
    openai: openaiSettings,
    xai: xaiSettings,
  };
}

function createImageClient(settings: AiSettings): ReturnType<typeof createOpenAI> {
  const apiKey = settings.imageApiKeyEncrypted
    ? decrypt(settings.imageApiKeyEncrypted)
    : settings.apiKeyEncrypted
      ? decrypt(settings.apiKeyEncrypted)
      : null;

  if (!apiKey) {
    throw new Error("Image API key not configured");
  }

  return createOpenAI({
    apiKey,
    baseURL: settings.baseUrl || undefined,
  });
}

async function getAvailableModelsFromRegistry(
  settings: MultiProviderSettings
): Promise<string[]> {
  const allModels: string[] = [];

  try {
    // Get OpenAI models if configured
    if (settings.openai?.apiKey) {
      const openaiClient = createOpenAI({
        apiKey: settings.openai.apiKey,
        baseURL: settings.openai.baseUrl || undefined,
      });
      const openaiModels = await discoverOpenAIModels(openaiClient);
      allModels.push(
        ...openaiModels.textModels.map((m) => m.id),
        ...openaiModels.imageModels.map((m) => m.id)
      );
    }

    // Get xAI models if configured
    if (settings.xai?.apiKey) {
      // xAI models are known (not discoverable via API)
      allModels.push("grok-beta", "grok-vision-beta", "grok-2-image-1212", "grok-code-fast-1");
    }

    return allModels;
  } catch (error) {
    console.error("Failed to discover available models:", error);
    return [];
  }
}

async function getLibrarySummary(userId: string): Promise<GameSummary[]> {
  const cached = await getCachedLibrary(userId);
  if (cached) {
    console.log(`Using cached library for user ${userId}`);
    return cached;
  }

  const games = await queryMany<{
    id: string;
    name: string;
    genres: string;
    status: string;
    user_rating: number | null;
    total_minutes: number | null;
    completion_percentage: number | null;
    series_name: string | null;
    release_date: string | null;
  }>(
    `SELECT
      g.id,
      g.name,
      COALESCE(string_agg(DISTINCT gen.name, ', '), '') as genres,
      COALESCE(ugp.status, 'backlog') as status,
      ugp.user_rating,
      upt.total_minutes,
      ugp.completion_percentage,
      g.series_name,
      g.release_date
    FROM user_games ug
    JOIN games g ON g.id = ug.game_id
    LEFT JOIN game_genres gg ON gg.game_id = g.id
    LEFT JOIN genres gen ON gen.id = gg.genre_id
    LEFT JOIN user_game_progress ugp ON ugp.user_id = ug.user_id AND ugp.game_id = g.id AND ugp.platform_id = ug.platform_id
    LEFT JOIN user_playtime upt ON upt.user_id = ug.user_id AND upt.game_id = g.id AND upt.platform_id = ug.platform_id
    WHERE ug.user_id = $1
    GROUP BY g.id, g.name, ugp.status, ugp.user_rating, upt.total_minutes, ugp.completion_percentage, g.series_name, g.release_date
    ORDER BY
      CASE
        WHEN ugp.status = 'playing' THEN 1
        WHEN upt.total_minutes IS NOT NULL THEN 2
        ELSE 3
      END,
      upt.total_minutes DESC NULLS LAST`,
    [userId]
  );

  const library: GameSummary[] = games.map((g) => ({
    id: g.id,
    name: g.name,
    genres: g.genres ? g.genres.split(", ").filter(Boolean) : [],
    status: g.status,
    rating: g.user_rating,
    playtimeHours: g.total_minutes ? Math.round(g.total_minutes / 60) : null,
    completionPercentage: g.completion_percentage,
    seriesName: g.series_name,
    releaseYear: g.release_date ? new Date(g.release_date).getFullYear() : null,
  }));

  await setCachedLibrary(userId, library);
  return library;
}

async function logActivity(
  userId: string,
  actionType: string,
  provider: string,
  model: string,
  usage: TokenUsage | null,
  durationMs: number,
  success: boolean,
  errorMessage: string | null = null,
  collectionId: string | null = null,
  userInput: string | null = null
): Promise<void> {
  const estimatedCost = usage ? calculateCost(model, usage) : null;

  await query(
    `INSERT INTO ai_activity_logs (
      user_id, action_type, provider, model, collection_id, user_input,
      prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd,
      duration_ms, success, error_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      userId,
      actionType,
      provider,
      model,
      collectionId,
      userInput,
      usage?.promptTokens ?? null,
      usage?.completionTokens ?? null,
      usage?.totalTokens ?? null,
      estimatedCost,
      durationMs,
      success,
      errorMessage,
    ]
  );
}

export async function suggestCollections(
  userId: string,
  theme?: string
): Promise<{ collections: CollectionSuggestion[]; cost: number }> {
  const startTime = Date.now();
  const providerSettings = await getAllUserProviderSettings(userId);
  const openaiSettings = providerSettings.openai;

  if (!openaiSettings || !openaiSettings.enabled) {
    throw new Error("AI features not configured");
  }

  const multiProviderSettings = buildMultiProviderSettings(
    providerSettings.openai,
    providerSettings.xai
  );

  // Early validation of provider credentials
  if (!multiProviderSettings.openai?.apiKey && !multiProviderSettings.xai?.apiKey) {
    throw new Error("No valid AI provider credentials configured");
  }

  // Get available models
  const availableModels = await getAvailableModelsFromRegistry(multiProviderSettings);

  const registry = createAIProviderRegistry(multiProviderSettings);

  // Select optimal model for this task
  const modelSelection = await selectModelForTask(
    "suggest_collections",
    openaiSettings,
    availableModels
  );

  const library = await getLibrarySummary(userId);

  if (library.length === 0) {
    throw new Error("No games in library to analyze");
  }

  // Check if embeddings exist, generate if needed
  const hasEmbeddings = await checkUserHasEmbeddings(userId);
  if (!hasEmbeddings) {
    console.log(`Generating embeddings for user ${userId} (first-time setup)`);
    await generateUserLibraryEmbeddings(openaiSettings, userId, 100);
  }

  // Check if preferences need regeneration
  const shouldRegenerate = await shouldRegeneratePreferences(userId);
  if (shouldRegenerate) {
    console.log(`Regenerating preferences for user ${userId}`);
    await generatePreferenceEmbeddings(openaiSettings, userId);
  }

  // Semantic filtering
  let selectedGames: GameSummary[];

  if (theme) {
    // Search for games matching the theme
    const similarGames = await searchSimilarGames(
      openaiSettings,
      `Games related to: ${theme}`,
      userId,
      50,
      0.6
    );

    const gameIds = new Set(similarGames.map((g) => g.gameId));
    selectedGames = library.filter((g) => gameIds.has(g.id)).slice(0, 25);

    // Fallback if no semantic matches
    if (selectedGames.length < 10) {
      console.log(`Semantic search found only ${selectedGames.length} games, using smart sampling`);
      selectedGames = smartSampleGames(library, 25);
    }
  } else {
    // Smart sampling for diverse selection
    selectedGames = smartSampleGames(library, 25);
  }

  console.log(
    `Selected ${selectedGames.length} games out of ${library.length} (${((selectedGames.length / library.length) * 100).toFixed(1)}%)`
  );

  try {
    const baseParams = {
      model: registry.languageModel(addProviderPrefix(modelSelection.model)),
      messages: [
        { role: "system" as const, content: SYSTEM_PROMPTS.organizer },
        {
          role: "user" as const,
          content: buildCollectionSuggestionsPromptWithRAG(selectedGames, library.length, theme),
        },
      ],
      maxOutputTokens: modelSelection.maxTokens,
      experimental_telemetry: { isEnabled: false },
    };

    // Only set temperature for non-reasoning models
    const result =
      modelSelection.temperature !== null
        ? await generateText({ ...baseParams, temperature: modelSelection.temperature })
        : await generateText(baseParams);

    const content = result.text;

    // Check if we hit token limit
    if (result.finishReason === "length") {
      console.warn("Response was truncated due to max_tokens limit");
      throw new Error(
        "Response truncated - increase max_tokens to at least 12000 for reasoning models"
      );
    }

    if (!content) {
      console.error("No content in response. Full result:", result);
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content) as { collections: Omit<CollectionSuggestion, "gameIds">[] };

    // Map game names to IDs using the library we already fetched
    const collectionsWithIds: CollectionSuggestion[] = parsed.collections.map((suggestion) => {
      const gameIds = suggestion.gameNames
        .map((name) => library.find((g) => g.name === name)?.id)
        .filter((id): id is string => id !== undefined);
      return { ...suggestion, gameIds };
    });

    const usage: TokenUsage = {
      promptTokens: result.usage?.inputTokens ?? 0,
      completionTokens: result.usage?.outputTokens ?? 0,
      totalTokens: result.usage?.totalTokens ?? 0,
    };
    const cost = calculateCost(modelSelection.model, usage);

    await logActivity(
      userId,
      "suggest_collections",
      getProviderFromModel(modelSelection.model),
      modelSelection.model,
      usage,
      Date.now() - startTime,
      true,
      null,
      null,
      theme ?? null
    );

    return { collections: collectionsWithIds, cost };
  } catch (error) {
    await logActivity(
      userId,
      "suggest_collections",
      getProviderFromModel(modelSelection.model),
      modelSelection.model,
      null,
      Date.now() - startTime,
      false,
      error instanceof Error ? error.message : "Unknown error",
      null,
      theme ?? null
    );
    throw error;
  }
}

export async function suggestNextGame(
  userId: string,
  userInput?: string
): Promise<{ suggestion: NextGameSuggestion; cost: number }> {
  const startTime = Date.now();
  const providerSettings = await getAllUserProviderSettings(userId);
  const openaiSettings = providerSettings.openai;

  if (!openaiSettings || !openaiSettings.enabled) {
    throw new Error("AI features not configured");
  }

  const multiProviderSettings = buildMultiProviderSettings(
    providerSettings.openai,
    providerSettings.xai
  );

  // Early validation of provider credentials
  if (!multiProviderSettings.openai?.apiKey && !multiProviderSettings.xai?.apiKey) {
    throw new Error("No valid AI provider credentials configured");
  }

  // Get available models
  const availableModels = await getAvailableModelsFromRegistry(multiProviderSettings);

  const registry = createAIProviderRegistry(multiProviderSettings);

  // Select optimal model for this task
  const modelSelection = await selectModelForTask(
    "suggest_next_game",
    openaiSettings,
    availableModels
  );

  const library = await getLibrarySummary(userId);
  const backlog = library.filter((g) => g.status === "backlog" || g.status === "playing");

  if (backlog.length === 0) {
    throw new Error("No games in backlog");
  }

  // Check if embeddings exist, generate if needed
  const hasEmbeddings = await checkUserHasEmbeddings(userId);
  if (!hasEmbeddings) {
    console.log(`Generating embeddings for user ${userId} (first-time setup)`);
    await generateUserLibraryEmbeddings(openaiSettings, userId, 100);
  }

  // Check if preferences need regeneration
  const shouldRegenerate = await shouldRegeneratePreferences(userId);
  if (shouldRegenerate) {
    console.log(`Regenerating preferences for user ${userId}`);
    await generatePreferenceEmbeddings(openaiSettings, userId);
  }

  // Semantic filtering
  let selectedGames: GameSummary[];

  if (userInput) {
    // Search for games matching user input
    const similarGames = await searchSimilarGames(openaiSettings, userInput, userId, 30, 0.6);

    const gameIds = new Set(similarGames.map((g) => g.gameId));
    selectedGames = backlog.filter((g) => gameIds.has(g.id)).slice(0, 20);

    // Fallback if no semantic matches
    if (selectedGames.length < 5) {
      console.log(`Semantic search found only ${selectedGames.length} games, using smart sampling`);
      selectedGames = smartSampleGames(backlog, 20);
    }
  } else {
    // Smart sampling
    selectedGames = smartSampleGames(backlog, 20);
  }

  console.log(
    `Selected ${selectedGames.length} games out of ${backlog.length} backlog games (${((selectedGames.length / backlog.length) * 100).toFixed(1)}%)`
  );

  try {
    const baseParams = {
      model: registry.languageModel(addProviderPrefix(modelSelection.model)),
      messages: [
        { role: "system" as const, content: SYSTEM_PROMPTS.curator },
        {
          role: "user" as const,
          content: buildNextGamePromptWithRAG(selectedGames, backlog.length, userInput),
        },
      ],
      maxOutputTokens: modelSelection.maxTokens,
      experimental_telemetry: { isEnabled: false },
    };

    // Only set temperature for non-reasoning models
    const result =
      modelSelection.temperature !== null
        ? await generateText({ ...baseParams, temperature: modelSelection.temperature })
        : await generateText(baseParams);

    const content = result.text;

    // Check if we hit token limit
    if (result.finishReason === "length") {
      console.warn("Response was truncated due to max_tokens limit");
      throw new Error(
        "Response truncated - increase max_tokens to at least 12000 for reasoning models"
      );
    }

    if (!content) {
      console.error("No content in next game response. Full result:", result);
      throw new Error("No response from AI");
    }

    const suggestion = JSON.parse(content) as NextGameSuggestion;

    const usage: TokenUsage = {
      promptTokens: result.usage?.inputTokens ?? 0,
      completionTokens: result.usage?.outputTokens ?? 0,
      totalTokens: result.usage?.totalTokens ?? 0,
    };
    const cost = calculateCost(modelSelection.model, usage);

    await logActivity(
      userId,
      "suggest_next_game",
      getProviderFromModel(modelSelection.model),
      modelSelection.model,
      usage,
      Date.now() - startTime,
      true,
      null,
      null,
      userInput ?? null
    );

    return { suggestion, cost };
  } catch (error) {
    await logActivity(
      userId,
      "suggest_next_game",
      getProviderFromModel(modelSelection.model),
      modelSelection.model,
      null,
      Date.now() - startTime,
      false,
      error instanceof Error ? error.message : "Unknown error",
      null,
      userInput ?? null
    );
    throw error;
  }
}

export async function generateCollectionCover(
  userId: string,
  collectionName: string,
  collectionDescription: string,
  collectionId: string
): Promise<{ imageUrl: string; cost: number }> {
  const startTime = Date.now();
  const providerSettings = await getAllUserProviderSettings(userId);
  const openaiSettings = providerSettings.openai;

  if (!openaiSettings || !openaiSettings.enabled) {
    throw new Error("AI features not configured");
  }

  const multiProviderSettings = buildMultiProviderSettings(
    providerSettings.openai,
    providerSettings.xai
  );

  // Early validation of provider credentials
  if (!multiProviderSettings.openai?.apiKey && !multiProviderSettings.xai?.apiKey) {
    throw new Error("No valid AI provider credentials configured");
  }

  // Get available models
  const availableModels = await getAvailableModelsFromRegistry(multiProviderSettings);

  // Select optimal model for this task
  const modelSelection = await selectModelForTask(
    "generate_cover_image",
    openaiSettings,
    availableModels
  );

  const size = "1024x1536"; // Portrait orientation for collection covers

  // Determine which provider to use for image generation
  const isXaiModel = modelSelection.model.startsWith("grok-");
  if (isXaiModel && !providerSettings.xai) {
    throw new Error("xAI provider not configured but xAI model selected");
  }
  const imageClient = isXaiModel
    ? createImageClient(providerSettings.xai!)
    : createImageClient(openaiSettings);

  // gpt-image models don't support quality/style parameters - only DALL-E models do
  const isDalleModel = modelSelection.model.includes("dall-e");

  try {
    const result = isDalleModel
      ? await generateImage({
          model: imageClient.image(modelSelection.model),
          prompt: buildCoverImagePrompt(collectionName, collectionDescription),
          size,
          providerOptions: {
            openai: {
              quality: "standard",
              style: "vivid",
            },
          },
        })
      : await generateImage({
          model: imageClient.image(modelSelection.model),
          prompt: buildCoverImagePrompt(collectionName, collectionDescription),
          size,
        });

    // Vercel AI SDK returns base64 encoded image
    if (!result.image.base64) {
      throw new Error("No image data in response");
    }

    const imageUrl = `data:${result.image.mediaType};base64,${result.image.base64}`;

    const usage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    const cost = calculateCost(modelSelection.model, usage);

    await logActivity(
      userId,
      "generate_cover_image",
      getProviderFromModel(modelSelection.model),
      modelSelection.model,
      usage,
      Date.now() - startTime,
      true,
      null,
      collectionId,
      `${collectionName}: ${collectionDescription}`
    );

    return { imageUrl, cost };
  } catch (error) {
    await logActivity(
      userId,
      "generate_cover_image",
      getProviderFromModel(modelSelection.model),
      modelSelection.model,
      null,
      Date.now() - startTime,
      false,
      error instanceof Error ? error.message : "Unknown error",
      collectionId,
      `${collectionName}: ${collectionDescription}`
    );
    throw error;
  }
}

export async function getActivityLogs(
  userId: string,
  limit = 50
): Promise<
  Array<{
    id: string;
    actionType: string;
    provider: string;
    model: string;
    success: boolean;
    estimatedCostUsd: number | null;
    durationMs: number | null;
    createdAt: string;
  }>
> {
  return await queryMany(
    `SELECT id, action_type as "actionType", provider, model, success, estimated_cost_usd as "estimatedCostUsd", duration_ms as "durationMs", created_at as "createdAt"
     FROM ai_activity_logs
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
}

export async function estimateCost(userId: string, actionType: string): Promise<number> {
  const settings = await getUserAiSettings(userId);
  if (!settings) {
    return 0;
  }

  const library = await getLibrarySummary(userId);

  if (actionType === "suggest_collections") {
    const estimatedPromptTokens = Math.min(library.length * 50, 4000);
    const estimatedCompletionTokens = 800;
    return calculateCost(settings.model, {
      promptTokens: estimatedPromptTokens,
      completionTokens: estimatedCompletionTokens,
      totalTokens: estimatedPromptTokens + estimatedCompletionTokens,
    });
  }

  if (actionType === "suggest_next_game") {
    const estimatedPromptTokens = Math.min(library.length * 30, 2000);
    const estimatedCompletionTokens = 300;
    return calculateCost(settings.model, {
      promptTokens: estimatedPromptTokens,
      completionTokens: estimatedCompletionTokens,
      totalTokens: estimatedPromptTokens + estimatedCompletionTokens,
    });
  }

  if (actionType === "generate_cover_image") {
    const model = settings.imageModel || "dall-e-3";
    return calculateCost(model, { promptTokens: 0, completionTokens: 0, totalTokens: 0 });
  }

  return 0;
}
