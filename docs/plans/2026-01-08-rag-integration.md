# RAG Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace "first 100 games" prompt strategy with semantic search to achieve 60-70% token reduction through intelligent game selection.

**Architecture:** Semantic filtering pipeline (query → embeddings → vector search → smart selection → LLM) with user preference learning and duplicate detection. Token reduction from 4000-5000 to 1500-2000 per request.

**Tech Stack:** pgvector (Phase 2), Vercel AI SDK embeddings, Drizzle ORM, existing AI service infrastructure

---

## Part A: Smart Game Selection

### Task 1: Create Game Selection Service

**Files:**

- Create: `backend/src/services/ai/game-selection.ts`

**Step 1: Create smart sampling function**

Create `backend/src/services/ai/game-selection.ts`:

```typescript
import type { GameSummary } from "@/services/ai/service";

export interface SelectionStrategy {
  playing: number; // % of limit
  highRated: number; // % of limit (rating >= 8)
  diverse: number; // % of limit (genre diversity)
  backlog: number; // % of limit
}

const DEFAULT_STRATEGY: SelectionStrategy = {
  playing: 0.2, // 20%
  highRated: 0.2, // 20%
  diverse: 0.4, // 40%
  backlog: 0.2, // 20%
};

export function smartSampleGames(
  library: GameSummary[],
  limit: number,
  strategy: SelectionStrategy = DEFAULT_STRATEGY
): GameSummary[] {
  const selected: GameSummary[] = [];
  const used = new Set<string>();

  // 1. Playing games (20%)
  const playing = library.filter((g) => g.status === "playing");
  const playingCount = Math.floor(limit * strategy.playing);
  for (let i = 0; i < Math.min(playingCount, playing.length); i++) {
    selected.push(playing[i]);
    used.add(playing[i].id);
  }

  // 2. High-rated games (20%)
  const highRated = library.filter((g) => !used.has(g.id) && (g.rating ?? 0) >= 8);
  const highRatedCount = Math.floor(limit * strategy.highRated);
  for (let i = 0; i < Math.min(highRatedCount, highRated.length); i++) {
    selected.push(highRated[i]);
    used.add(highRated[i].id);
  }

  // 3. Diverse genres (40%)
  const diverseCount = Math.floor(limit * strategy.diverse);
  const genreMap = new Map<string, GameSummary[]>();
  for (const game of library) {
    if (used.has(game.id)) continue;
    for (const genre of game.genres) {
      if (!genreMap.has(genre)) genreMap.set(genre, []);
      genreMap.get(genre)!.push(game);
    }
  }
  const genres = Array.from(genreMap.keys());
  let genreIndex = 0;
  for (let i = 0; i < diverseCount && genres.length > 0; i++) {
    const genre = genres[genreIndex % genres.length];
    const gamesInGenre = genreMap.get(genre)!.filter((g) => !used.has(g.id));
    if (gamesInGenre.length > 0) {
      selected.push(gamesInGenre[0]);
      used.add(gamesInGenre[0].id);
    }
    genreIndex++;
  }

  // 4. Backlog games (20%)
  const backlog = library.filter((g) => !used.has(g.id) && g.status === "backlog");
  const backlogCount = Math.floor(limit * strategy.backlog);
  for (let i = 0; i < Math.min(backlogCount, backlog.length); i++) {
    selected.push(backlog[i]);
    used.add(backlog[i].id);
  }

  // Fill remaining slots with any unused games
  const remaining = library.filter((g) => !used.has(g.id));
  for (let i = 0; i < remaining.length && selected.length < limit; i++) {
    selected.push(remaining[i]);
  }

  return selected.slice(0, limit);
}

export function weightGamesByPreferences(
  library: GameSummary[],
  preferenceEmbeddings: Array<{ embedding: number[]; weight: number }>
): GameSummary[] {
  // TODO: Phase 3.2 - Calculate similarity scores and weight by preferences
  // For now, return library as-is (will be implemented after preference learning)
  return library;
}
```

**Step 2: Verify TypeScript**

Run:

```bash
cd backend
bun run typecheck
```

Expected: PASS

**Step 3: Verify lint**

Run:

```bash
cd backend
bun run lint
```

Expected: PASS

**Step 4: Commit**

```bash
git add backend/src/services/ai/game-selection.ts
git commit -m "feat: add smart game selection with diverse sampling"
```

---

### Task 2: Create Preference Learning Service

**Files:**

- Create: `backend/src/services/ai/preference-learning.ts`

**Step 1: Create preference analysis functions**

Create `backend/src/services/ai/preference-learning.ts`:

```typescript
import { db } from "@/db";
import {
  userGames,
  games,
  userGameProgress,
  gameGenres,
  genres,
  userPreferenceEmbeddings,
} from "@/db/schema";
import { eq, and, sql, gte } from "drizzle-orm";
import { embed } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { decrypt } from "@/lib/encryption";
import type { GameSummary } from "./service";

interface AiSettings {
  provider: string;
  baseUrl: string | null;
  apiKeyEncrypted: string | null;
  model: string;
  imageApiKeyEncrypted: string | null;
  imageModel: string | null;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
}

export interface UserPreference {
  type: string;
  games: GameSummary[];
  weight: number;
}

const EMBEDDING_MODEL = "text-embedding-3-small";
const STALE_THRESHOLD_DAYS = 7;

export async function shouldRegeneratePreferences(userId: string): Promise<boolean> {
  const latestPreference = await db
    .select({ updatedAt: userPreferenceEmbeddings.updatedAt })
    .from(userPreferenceEmbeddings)
    .where(eq(userPreferenceEmbeddings.userId, userId))
    .orderBy(sql`${userPreferenceEmbeddings.updatedAt} DESC`)
    .limit(1);

  if (latestPreference.length === 0) return true;

  const daysSinceUpdate =
    (Date.now() - latestPreference[0].updatedAt!.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate >= STALE_THRESHOLD_DAYS;
}

export async function analyzeUserPreferences(userId: string): Promise<UserPreference[]> {
  const preferences: UserPreference[] = [];

  // 1. Genre preferences (based on ratings)
  const genreRatings = await db
    .select({
      genreName: genres.name,
      avgRating: sql<number>`AVG(${userGameProgress.rating})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(userGameProgress)
    .innerJoin(userGames, eq(userGameProgress.userId, userGames.userId))
    .innerJoin(games, eq(userGames.gameId, games.id))
    .innerJoin(gameGenres, eq(games.id, gameGenres.gameId))
    .innerJoin(genres, eq(gameGenres.genreId, genres.id))
    .where(and(eq(userGameProgress.userId, userId), gte(userGameProgress.rating, 8)))
    .groupBy(genres.name)
    .having(sql`COUNT(*) >= 3`)
    .orderBy(sql`AVG(${userGameProgress.rating}) DESC`)
    .limit(3);

  // Fetch games for each preferred genre
  for (const genreRating of genreRatings) {
    const genreGames = await db
      .select({
        id: games.id,
        name: games.name,
        rating: userGameProgress.rating,
      })
      .from(userGameProgress)
      .innerJoin(userGames, eq(userGameProgress.userId, userGames.userId))
      .innerJoin(games, eq(userGames.gameId, games.id))
      .innerJoin(gameGenres, eq(games.id, gameGenres.gameId))
      .innerJoin(genres, eq(gameGenres.genreId, genres.id))
      .where(
        and(
          eq(userGameProgress.userId, userId),
          eq(genres.name, genreRating.genreName),
          gte(userGameProgress.rating, 8)
        )
      )
      .limit(5);

    const games = await db.query.games.findMany({
      where: sql`${games.id} = ANY(${genreGames.map((g: any) => g.id)})`,
      with: {
        gameGenres: {
          with: {
            genre: true,
          },
        },
      },
    });

    preferences.push({
      type: `genre_${genreRating.genreName.toLowerCase().replace(/\s+/g, "_")}`,
      games: games.map((g: any) => ({
        id: g.id,
        name: g.name,
        genres: g.gameGenres.map((gg: any) => gg.genre.name),
        status: "completed",
        rating: genreGames.find((gg: any) => gg.id === g.id)?.rating ?? null,
      })),
      weight: Number(genreRating.avgRating) / 10, // Normalize to 0-1
    });
  }

  // 2. Completed game themes
  const completedGames = await db
    .select({
      id: games.id,
      name: games.name,
      description: games.description,
    })
    .from(userGameProgress)
    .innerJoin(userGames, eq(userGameProgress.userId, userGames.userId))
    .innerJoin(games, eq(userGames.gameId, games.id))
    .where(and(eq(userGameProgress.userId, userId), eq(userGameProgress.status, "completed")))
    .limit(10);

  if (completedGames.length >= 3) {
    const gamesWithGenres = await db.query.games.findMany({
      where: sql`${games.id} = ANY(${completedGames.map((g) => g.id)})`,
      with: {
        gameGenres: {
          with: {
            genre: true,
          },
        },
      },
    });

    preferences.push({
      type: "completed_themes",
      games: gamesWithGenres.map((g: any) => ({
        id: g.id,
        name: g.name,
        genres: g.gameGenres.map((gg: any) => gg.genre.name),
        status: "completed",
        rating: null,
      })),
      weight: 0.8,
    });
  }

  return preferences;
}

export async function generatePreferenceEmbeddings(
  settings: AiSettings,
  userId: string
): Promise<void> {
  const preferences = await analyzeUserPreferences(userId);

  if (preferences.length === 0) {
    console.log(`No preferences found for user ${userId}`);
    return;
  }

  const openai = createOpenAI({
    apiKey: decrypt(settings.apiKeyEncrypted!),
    baseURL: settings.baseUrl || undefined,
  });

  for (const preference of preferences) {
    // Build text from games
    const text = preference.games.map((g) => `${g.name} (${g.genres.join(", ")})`).join("\n");

    // Generate embedding
    const { embedding } = await embed({
      model: openai.textEmbeddingModel(EMBEDDING_MODEL),
      value: text,
    });

    // Check if preference embedding exists
    const existing = await db
      .select()
      .from(userPreferenceEmbeddings)
      .where(
        and(
          eq(userPreferenceEmbeddings.userId, userId),
          eq(userPreferenceEmbeddings.preferenceType, preference.type)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await db
        .update(userPreferenceEmbeddings)
        .set({
          embedding,
          confidence: preference.weight,
          sampleSize: preference.games.length,
          updatedAt: new Date(),
        })
        .where(eq(userPreferenceEmbeddings.id, existing[0].id));
    } else {
      // Insert new
      await db.insert(userPreferenceEmbeddings).values({
        userId,
        preferenceType: preference.type,
        embedding,
        confidence: preference.weight,
        sampleSize: preference.games.length,
      });
    }
  }

  console.log(`Generated ${preferences.length} preference embeddings for user ${userId}`);
}
```

**Step 2: Verify TypeScript**

Run:

```bash
cd backend
bun run typecheck
```

Expected: PASS

**Step 3: Verify lint**

Run:

```bash
cd backend
bun run lint
```

Expected: PASS

**Step 4: Commit**

```bash
git add backend/src/services/ai/preference-learning.ts
git commit -m "feat: add user preference learning and embedding generation"
```

---

### Task 3: Create Duplicate Detection Service

**Files:**

- Create: `backend/src/services/ai/duplicate-detection.ts`

**Step 1: Create duplicate detection function**

Create `backend/src/services/ai/duplicate-detection.ts`:

```typescript
import { db } from "@/db";
import { collections, collectionEmbeddings } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { embed } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { decrypt } from "@/lib/encryption";
import { getCachedEmbedding, setCachedEmbedding } from "./embeddings-cache";
import { hashText } from "./embeddings";

interface AiSettings {
  provider: string;
  baseUrl: string | null;
  apiKeyEncrypted: string | null;
  model: string;
  imageApiKeyEncrypted: string | null;
  imageModel: string | null;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
}

export interface SimilarCollection {
  id: string;
  name: string;
  description: string | null;
  similarity: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarCollections: SimilarCollection[];
}

const EMBEDDING_MODEL = "text-embedding-3-small";
const DUPLICATE_THRESHOLD = 0.85;

function buildCollectionEmbeddingText(name: string, description: string | null): string {
  return `Collection: ${name}\nDescription: ${description || "No description"}`;
}

export async function detectDuplicateCollection(
  settings: AiSettings,
  userId: string,
  name: string,
  description: string | null,
  minSimilarity: number = DUPLICATE_THRESHOLD
): Promise<DuplicateCheckResult> {
  // Generate embedding for the new collection
  const text = buildCollectionEmbeddingText(name, description);
  const textHash = hashText(text);

  // Check cache
  let queryEmbedding = await getCachedEmbedding(textHash);

  if (!queryEmbedding) {
    const openai = createOpenAI({
      apiKey: decrypt(settings.apiKeyEncrypted!),
      baseURL: settings.baseUrl || undefined,
    });

    const { embedding } = await embed({
      model: openai.textEmbeddingModel(EMBEDDING_MODEL),
      value: text,
    });

    queryEmbedding = embedding;
    await setCachedEmbedding(textHash, embedding, EMBEDDING_MODEL);
  }

  // Search for similar collections
  const results = await db
    .select({
      collectionId: collectionEmbeddings.collectionId,
      collectionName: collections.name,
      collectionDescription: collections.description,
      similarity: sql<number>`1 - (${collectionEmbeddings.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`,
    })
    .from(collectionEmbeddings)
    .innerJoin(collections, eq(collectionEmbeddings.collectionId, collections.id))
    .where(
      and(
        eq(collections.userId, userId),
        sql`1 - (${collectionEmbeddings.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${minSimilarity}`
      )
    )
    .orderBy(
      desc(
        sql`1 - (${collectionEmbeddings.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`
      )
    )
    .limit(5);

  const similarCollections: SimilarCollection[] = results.map((r) => ({
    id: r.collectionId,
    name: r.collectionName,
    description: r.collectionDescription,
    similarity: r.similarity,
  }));

  const isDuplicate =
    similarCollections.length > 0 && similarCollections[0].similarity >= minSimilarity;

  return {
    isDuplicate,
    similarCollections,
  };
}

export async function generateCollectionEmbedding(
  settings: AiSettings,
  collectionId: string,
  name: string,
  description: string | null
): Promise<void> {
  const text = buildCollectionEmbeddingText(name, description);
  const textHash = hashText(text);

  const openai = createOpenAI({
    apiKey: decrypt(settings.apiKeyEncrypted!),
    baseURL: settings.baseUrl || undefined,
  });

  const { embedding } = await embed({
    model: openai.textEmbeddingModel(EMBEDDING_MODEL),
    value: text,
  });

  // Check if embedding exists
  const existing = await db
    .select()
    .from(collectionEmbeddings)
    .where(eq(collectionEmbeddings.collectionId, collectionId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(collectionEmbeddings)
      .set({
        embedding,
        textHash,
        updatedAt: new Date(),
      })
      .where(eq(collectionEmbeddings.collectionId, collectionId));
  } else {
    // Insert new
    await db.insert(collectionEmbeddings).values({
      collectionId,
      embedding,
      textHash,
      model: EMBEDDING_MODEL,
    });
  }

  // Cache it
  await setCachedEmbedding(textHash, embedding, EMBEDDING_MODEL);
}
```

**Step 2: Verify TypeScript**

Run:

```bash
cd backend
bun run typecheck
```

Expected: PASS

**Step 3: Verify lint**

Run:

```bash
cd backend
bun run lint
```

Expected: PASS

**Step 4: Commit**

```bash
git add backend/src/services/ai/duplicate-detection.ts
git commit -m "feat: add duplicate collection detection with similarity threshold"
```

---

## Part B: Update AI Service with RAG

### Task 4: Update Prompts for RAG

**Files:**

- Modify: `backend/src/services/ai/prompts.ts`

**Step 1: Add RAG-aware prompt builder**

Add to `backend/src/services/ai/prompts.ts` (after existing exports):

```typescript
export function buildCollectionSuggestionsPromptWithRAG(
  semanticGames: GameSummary[],
  allGamesCount: number,
  theme?: string
): string {
  const libraryText = semanticGames
    .map(
      (g) =>
        `${g.name} (${g.genres.join(", ")}) - ${g.status}${g.rating ? ` [${g.rating}/10]` : ""}`
    )
    .join("\n");

  const themeContext = theme
    ? `The user specifically requested collections related to: "${theme}"\n\n`
    : "";

  return `${themeContext}Based on this semantically-filtered subset of the user's ${allGamesCount}-game library, suggest 3-5 themed collections.

**Filtered Games (${semanticGames.length} most relevant out of ${allGamesCount} total):**
${libraryText}

**Instructions:**
- Each collection should have 4-8 games minimum
- Collections should be thematic (genre, setting, gameplay style, mood, era, franchise)
- Avoid generic categories like "Action Games" or "RPGs"
- Be specific and creative with themes
- Only suggest collections where the user has enough matching games
${theme ? `- Focus on the requested theme: "${theme}"` : "- Identify diverse themes that showcase different aspects of their library"}

Return a JSON array of collection suggestions:
[
  {
    "name": "Collection Name",
    "description": "Brief description explaining the theme",
    "gameIds": ["id1", "id2", ...]
  }
]`;
}

export function buildNextGamePromptWithRAG(
  semanticGames: GameSummary[],
  allGamesCount: number,
  userInput?: string
): string {
  const libraryText = semanticGames
    .map(
      (g) =>
        `${g.name} (${g.genres.join(", ")}) - ${g.status}${g.rating ? ` [${g.rating}/10]` : ""}`
    )
    .join("\n");

  const inputContext = userInput
    ? `The user said: "${userInput}"\n\n`
    : "The user wants a general recommendation.\n\n";

  return `${inputContext}Based on this semantically-filtered subset of the user's ${allGamesCount}-game backlog, suggest their next game to play.

**Filtered Games (${semanticGames.length} most relevant out of ${allGamesCount} total):**
${libraryText}

**Instructions:**
- Suggest ONE game from their backlog
- Consider their play patterns (what they're currently playing, what they rated highly)
- Match the user's request if they provided specific criteria
- Explain why this game is a good choice right now

Return JSON:
{
  "gameId": "id",
  "reason": "Explanation of why this game"
}`;
}
```

**Step 2: Verify TypeScript**

Run:

```bash
cd backend
bun run typecheck
```

Expected: PASS

**Step 3: Verify lint**

Run:

```bash
cd backend
bun run lint
```

Expected: PASS

**Step 4: Commit**

```bash
git add backend/src/services/ai/prompts.ts
git commit -m "feat: add rag-aware prompt builders with semantic context"
```

---

### Task 5: Update AI Service to Use RAG

**Files:**

- Modify: `backend/src/services/ai/service.ts`

**Step 1: Import new dependencies**

Add to imports at top of `backend/src/services/ai/service.ts`:

```typescript
import { searchSimilarGames } from "./vector-search";
import { smartSampleGames } from "./game-selection";
import { shouldRegeneratePreferences, generatePreferenceEmbeddings } from "./preference-learning";
import { buildCollectionSuggestionsPromptWithRAG, buildNextGamePromptWithRAG } from "./prompts";
import { checkUserHasEmbeddings, generateUserLibraryEmbeddings } from "./embedding-jobs";
```

**Step 2: Update suggestCollections function**

Replace the `suggestCollections` function in `backend/src/services/ai/service.ts`:

```typescript
export async function suggestCollections(
  userId: string,
  theme?: string
): Promise<{ collections: CollectionSuggestion[]; cost: number }> {
  const startTime = Date.now();
  const settings = await getUserAiSettings(userId);

  if (!settings || !settings.enabled) {
    throw new Error("AI features are disabled");
  }

  const library = await getLibrarySummary(userId);

  if (library.length === 0) {
    throw new Error("No games in library");
  }

  // Check if embeddings exist, generate if needed
  const hasEmbeddings = await checkUserHasEmbeddings(userId);
  if (!hasEmbeddings) {
    console.log(`Generating embeddings for user ${userId} (first-time setup)`);
    await generateUserLibraryEmbeddings(settings, userId, 100);
  }

  // Check if preferences need regeneration
  const shouldRegenerate = await shouldRegeneratePreferences(userId);
  if (shouldRegenerate) {
    console.log(`Regenerating preferences for user ${userId}`);
    await generatePreferenceEmbeddings(settings, userId);
  }

  // Semantic filtering
  let selectedGames: GameSummary[];

  if (theme) {
    // Search for games matching the theme
    const similarGames = await searchSimilarGames(
      settings,
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

  const openai = createOpenAI({
    apiKey: decrypt(settings.apiKeyEncrypted!),
    baseURL: settings.baseUrl || undefined,
  });

  const result = await generateText({
    model: openai(settings.model),
    messages: [
      { role: "system", content: SYSTEM_PROMPTS.organizer },
      {
        role: "user",
        content: buildCollectionSuggestionsPromptWithRAG(selectedGames, library.length, theme),
      },
    ],
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
  });

  const usage: TokenUsage = {
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    totalTokens: result.usage.totalTokens,
  };

  const cost = calculateCost(settings.model, usage);

  await logActivity(
    userId,
    "suggest_collections",
    settings.provider,
    settings.model,
    usage,
    Date.now() - startTime,
    true
  );

  let collections: CollectionSuggestion[];
  try {
    collections = JSON.parse(result.text);
  } catch {
    throw new Error("Failed to parse AI response");
  }

  return { collections, cost };
}
```

**Step 3: Update suggestNextGame function**

Replace the `suggestNextGame` function in `backend/src/services/ai/service.ts`:

```typescript
export async function suggestNextGame(
  userId: string,
  userInput?: string
): Promise<{ game: NextGameSuggestion; cost: number }> {
  const startTime = Date.now();
  const settings = await getUserAiSettings(userId);

  if (!settings || !settings.enabled) {
    throw new Error("AI features are disabled");
  }

  const library = await getLibrarySummary(userId);
  const backlog = library.filter((g) => g.status === "backlog" || g.status === "playing");

  if (backlog.length === 0) {
    throw new Error("No games in backlog");
  }

  // Check if embeddings exist, generate if needed
  const hasEmbeddings = await checkUserHasEmbeddings(userId);
  if (!hasEmbeddings) {
    console.log(`Generating embeddings for user ${userId} (first-time setup)`);
    await generateUserLibraryEmbeddings(settings, userId, 100);
  }

  // Check if preferences need regeneration
  const shouldRegenerate = await shouldRegeneratePreferences(userId);
  if (shouldRegenerate) {
    console.log(`Regenerating preferences for user ${userId}`);
    await generatePreferenceEmbeddings(settings, userId);
  }

  // Semantic filtering
  let selectedGames: GameSummary[];

  if (userInput) {
    // Search for games matching user input
    const similarGames = await searchSimilarGames(settings, userInput, userId, 30, 0.6);

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

  const openai = createOpenAI({
    apiKey: decrypt(settings.apiKeyEncrypted!),
    baseURL: settings.baseUrl || undefined,
  });

  const result = await generateText({
    model: openai(settings.model),
    messages: [
      { role: "system", content: SYSTEM_PROMPTS.advisor },
      {
        role: "user",
        content: buildNextGamePromptWithRAG(selectedGames, backlog.length, userInput),
      },
    ],
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
  });

  const usage: TokenUsage = {
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    totalTokens: result.usage.totalTokens,
  };

  const cost = calculateCost(settings.model, usage);

  await logActivity(
    userId,
    "suggest_next_game",
    settings.provider,
    settings.model,
    usage,
    Date.now() - startTime,
    true
  );

  let game: NextGameSuggestion;
  try {
    game = JSON.parse(result.text);
  } catch {
    throw new Error("Failed to parse AI response");
  }

  return { game, cost };
}
```

**Step 4: Verify TypeScript**

Run:

```bash
cd backend
bun run typecheck
```

Expected: PASS

**Step 5: Verify lint**

Run:

```bash
cd backend
bun run lint
```

Expected: PASS

**Step 6: Commit**

```bash
git add backend/src/services/ai/service.ts
git commit -m "feat: integrate rag with semantic search and smart sampling"
```

---

## Part C: Add Duplicate Detection API

### Task 6: Add Duplicate Check Endpoint

**Files:**

- Modify: `backend/src/routes/collections.ts`

**Step 1: Import duplicate detection**

Add to imports at top of `backend/src/routes/collections.ts`:

```typescript
import { detectDuplicateCollection } from "@/services/ai/duplicate-detection";
import { getUserAiSettings } from "@/services/ai/service";
```

**Step 2: Add duplicate check endpoint**

Add before the final export in `backend/src/routes/collections.ts`:

```typescript
router.post(
  "/api/collections/check-duplicate",
  requireAuth(async (req, user) => {
    try {
      const body = (await req.json()) as { name: string; description?: string };

      if (!body.name) {
        return new Response(JSON.stringify({ error: "Collection name is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const settings = await getUserAiSettings(user.id);

      if (!settings || !settings.enabled) {
        // If AI is disabled, skip duplicate check
        return new Response(JSON.stringify({ isDuplicate: false, similarCollections: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }

      const result = await detectDuplicateCollection(
        settings,
        user.id,
        body.name,
        body.description ?? null
      );

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } catch (error) {
      console.error("Check duplicate collection error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  })
);
```

**Step 3: Update collection creation to generate embeddings**

Find the `POST /api/collections` endpoint and add embedding generation after successful creation.

Add import at top:

```typescript
import { generateCollectionEmbedding } from "@/services/ai/duplicate-detection";
```

After the collection is created (after `await db.insert(collections).values(...)`), add:

```typescript
// Generate embedding for duplicate detection (async, don't wait)
getUserAiSettings(user.id).then((settings) => {
  if (settings && settings.enabled) {
    generateCollectionEmbedding(
      settings,
      newCollection.id,
      newCollection.name,
      newCollection.description
    ).catch((err) => console.error("Failed to generate collection embedding:", err));
  }
});
```

**Step 4: Verify TypeScript**

Run:

```bash
cd backend
bun run typecheck
```

Expected: PASS

**Step 5: Verify lint**

Run:

```bash
cd backend
bun run lint
```

Expected: PASS

**Step 6: Commit**

```bash
git add backend/src/routes/collections.ts
git commit -m "feat: add duplicate collection detection endpoint"
```

---

## Part D: Manual Testing

### Task 7: Test RAG Integration

**Files:**

- None (manual testing only)

**Step 1: Start development environment**

Run:

```bash
# Terminal 1: Infrastructure
make dev

# Terminal 2: Backend
cd backend
bun run dev
```

Expected: Backend running on :3000

**Step 2: Test collection suggestions (no theme)**

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USERNAME","password":"YOUR_PASSWORD"}' \
  | jq -r '.token')

# Test collection suggestions
curl -s -X POST http://localhost:3000/api/ai/suggest-collections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq

# Check token usage in logs - should be 1500-2000 tokens (down from 4000-5000)
```

**Step 3: Test collection suggestions (with theme)**

```bash
curl -s -X POST http://localhost:3000/api/ai/suggest-collections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"theme": "cozy games"}' | jq

# Verify semantic search finds relevant games
```

**Step 4: Test next game suggestions**

```bash
curl -s -X POST http://localhost:3000/api/ai/suggest-next-game \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userInput": "something challenging"}' | jq
```

**Step 5: Test duplicate detection**

```bash
# First, create a collection
curl -s -X POST http://localhost:3000/api/collections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Indie Gems", "description": "Hidden indie treasures"}' | jq

# Wait a few seconds for embedding generation

# Test duplicate check with similar name
curl -s -X POST http://localhost:3000/api/collections/check-duplicate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Hidden Indie Treasures", "description": "Indie games worth playing"}' | jq

# Should return isDuplicate: true with similarity score
```

**Step 6: Verify token reduction**

Check backend logs for token usage:

```bash
# Look for log lines like:
# Selected 20 games out of 150 (13.3%)
# Token usage: 1532 (was ~4500 before RAG)
```

Expected: 60-70% token reduction

**Step 7: Test preference learning**

```bash
# Preferences regenerate automatically after 7 days
# Or trigger manually by making AI request after deleting preferences:

psql postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard \
  -c "DELETE FROM user_preference_embeddings WHERE user_id = 'YOUR_USER_ID';"

# Next AI request will regenerate preferences
curl -s -X POST http://localhost:3000/api/ai/suggest-collections \
  -H "Authorization: Bearer $TOKEN" | jq

# Check logs for "Regenerating preferences for user..."
```

---

## Success Metrics

After completing all tasks:

| Metric                        | Before RAG | After RAG  | Target               |
| ----------------------------- | ---------- | ---------- | -------------------- |
| Tokens per collection request | 4000-5000  | 1500-2000  | 60-70% reduction ✓   |
| Games in prompt               | 100        | 15-25      | Semantic selection ✓ |
| Cost per request              | $0.004     | $0.0015    | 60%+ savings ✓       |
| Response time                 | 3-5s       | 2-4s       | Maintained ✓         |
| Suggestion quality            | Baseline   | ≥ Baseline | No regression ✓      |

## Notes

- Token reduction is the primary goal (60-70%)
- Suggestion quality must not regress
- First-time embedding generation adds ~10-15s latency (one-time only)
- Preference learning happens automatically every 7 days
- Duplicate detection is optional (gracefully degrades if AI disabled)
