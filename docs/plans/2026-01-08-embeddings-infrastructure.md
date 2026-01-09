# Embeddings Infrastructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add pgvector extension, create embedding tables, implement generation and caching services

**Architecture:**

- pgvector for vector similarity search with HNSW indexes
- Redis for embedding caching (30-day TTL)
- Vercel AI SDK for embedding generation
- 4 embedding tables: games, collections, achievements, user preferences

**Tech Stack:** PostgreSQL 16+, pgvector 0.2+, Drizzle ORM, Redis, Vercel AI SDK

---

## Part A: Database Infrastructure

### Task 1: Install pgvector Dependency

**Files:**

- Modify: `backend/package.json`

**Step 1: Add pgvector dependency**

Run:

```bash
cd backend
bun add pgvector@^0.2.0
```

Expected: `package.json` updated with `"pgvector": "^0.2.0"`

**Step 2: Verify installation**

Run:

```bash
bun install
bun run typecheck
```

Expected: PASS (no errors)

**Step 3: Commit**

```bash
git add backend/package.json backend/bun.lockb
git commit -m "feat: add pgvector dependency for embeddings support"
```

---

### Task 2: Import Vector Types in Schema

**Files:**

- Modify: `backend/src/db/schema.ts:1-18`

**Step 1: Add vector import to schema**

In `backend/src/db/schema.ts`, update imports section (after line 17):

```typescript
import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  real,
  date,
  bigint,
  unique,
  index,
  check,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { vector } from "pgvector/drizzle-orm";
```

**Step 2: Verify imports**

Run:

```bash
cd backend
bun run typecheck
```

Expected: PASS (vector type available)

**Step 3: Commit**

```bash
git add backend/src/db/schema.ts
git commit -m "feat: import pgvector types for embedding tables"
```

---

### Task 3: Create game_embeddings Table

**Files:**

- Modify: `backend/src/db/schema.ts` (add at end of file before exports)

**Step 1: Add game_embeddings table definition**

Add to `backend/src/db/schema.ts` (before final exports):

```typescript
// ============================================================================
// EMBEDDINGS
// ============================================================================

export const gameEmbeddings = pgTable(
  "game_embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .unique()
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    embedding: vector("embedding", { dimensions: 1536 }),
    textHash: varchar("text_hash", { length: 64 }).notNull(),
    model: varchar("model", { length: 50 }).notNull().default("text-embedding-3-small"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_game_embeddings_game").on(table.gameId),
    index("idx_game_embeddings_vector").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ]
);
```

**Step 2: Verify TypeScript**

Run:

```bash
cd backend
bun run typecheck
```

Expected: PASS (no type errors)

**Step 3: Commit**

```bash
git add backend/src/db/schema.ts
git commit -m "feat: add game_embeddings table with pgvector support"
```

---

### Task 4: Create collection_embeddings Table

**Files:**

- Modify: `backend/src/db/schema.ts` (add after game_embeddings)

**Step 1: Add collection_embeddings table**

Add after `gameEmbeddings`:

```typescript
export const collectionEmbeddings = pgTable(
  "collection_embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collectionId: uuid("collection_id")
      .unique()
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    embedding: vector("embedding", { dimensions: 1536 }),
    textHash: varchar("text_hash", { length: 64 }).notNull(),
    model: varchar("model", { length: 50 }).notNull().default("text-embedding-3-small"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_collection_embeddings_collection").on(table.collectionId),
    index("idx_collection_embeddings_vector").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);
```

**Step 2: Verify TypeScript**

Run:

```bash
cd backend
bun run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add backend/src/db/schema.ts
git commit -m "feat: add collection_embeddings table"
```

---

### Task 5: Create achievement_embeddings Table

**Files:**

- Modify: `backend/src/db/schema.ts` (add after collection_embeddings)

**Step 1: Add achievement_embeddings table**

Add after `collectionEmbeddings`:

```typescript
export const achievementEmbeddings = pgTable(
  "achievement_embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    achievementId: uuid("achievement_id")
      .unique()
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    embedding: vector("embedding", { dimensions: 1536 }),
    textHash: varchar("text_hash", { length: 64 }).notNull(),
    model: varchar("model", { length: 50 }).notNull().default("text-embedding-3-small"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_achievement_embeddings_achievement").on(table.achievementId),
    index("idx_achievement_embeddings_vector").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);
```

**Step 2: Verify TypeScript**

Run:

```bash
cd backend
bun run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add backend/src/db/schema.ts
git commit -m "feat: add achievement_embeddings table"
```

---

### Task 6: Create user_preference_embeddings Table

**Files:**

- Modify: `backend/src/db/schema.ts` (add after achievement_embeddings)

**Step 1: Add user_preference_embeddings table**

Add after `achievementEmbeddings`:

```typescript
export const userPreferenceEmbeddings = pgTable(
  "user_preference_embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    preferenceType: varchar("preference_type", { length: 50 }).notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    confidence: real("confidence").notNull().default(0.5),
    sampleSize: integer("sample_size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique().on(table.userId, table.preferenceType),
    index("idx_user_pref_embeddings_user").on(table.userId),
    index("idx_user_pref_embeddings_vector").using("hnsw", table.embedding.op("vector_cosine_ops")),
  ]
);
```

**Step 2: Verify TypeScript**

Run:

```bash
cd backend
bun run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add backend/src/db/schema.ts
git commit -m "feat: add user_preference_embeddings table"
```

---

### Task 7: Generate and Verify Migrations

**Files:**

- Create: `drizzle/0018_*.sql` (auto-generated)
- Create: `drizzle/meta/0018_snapshot.json` (auto-generated)

**Step 1: Generate migration from schema changes**

Run:

```bash
cd backend
bun run db:generate
```

Expected: Creates migration files in `drizzle/` directory

**Step 2: Review generated SQL**

Check that migration includes:

- `CREATE EXTENSION IF NOT EXISTS vector;`
- `CREATE TABLE game_embeddings (...)`
- `CREATE TABLE collection_embeddings (...)`
- `CREATE TABLE achievement_embeddings (...)`
- `CREATE TABLE user_preference_embeddings (...)`
- HNSW indexes for vector columns

**Step 3: Apply migration**

Run:

```bash
cd backend
bun run db:migrate
```

Expected: Migration applied successfully

**Step 4: Verify database schema**

Run:

```bash
psql postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard -c "\dx vector"
psql postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard -c "\d game_embeddings"
```

Expected:

- vector extension listed
- game_embeddings table exists with embedding column

**Step 5: Commit migration files**

```bash
git add drizzle/
git commit -m "feat: generate pgvector migrations for embedding tables"
```

---

## Part B: Caching Layer

### Task 8: Create Embeddings Cache Service

**Files:**

- Create: `backend/src/services/ai/embeddings-cache.ts`

**Step 1: Create cache service skeleton**

Create `backend/src/services/ai/embeddings-cache.ts`:

```typescript
import { redis } from "@/services/redis";

const EMBEDDING_CACHE_TTL = 60 * 60 * 24 * 30; // 30 days
const SEARCH_CACHE_TTL = 60 * 60 * 24; // 24 hours

export interface CachedEmbedding {
  embedding: number[];
  model: string;
  timestamp: number;
}

export interface CachedSearchResults {
  gameIds: string[];
  timestamp: number;
}

export async function getCachedEmbedding(key: string): Promise<number[] | null> {
  const cached = await redis.get(`embedding:${key}`);
  if (!cached) return null;

  const data: CachedEmbedding = JSON.parse(cached);
  return data.embedding;
}

export async function setCachedEmbedding(
  key: string,
  embedding: number[],
  model: string
): Promise<void> {
  const data: CachedEmbedding = {
    embedding,
    model,
    timestamp: Date.now(),
  };

  await redis.setEx(`embedding:${key}`, EMBEDDING_CACHE_TTL, JSON.stringify(data));
}

export async function getCachedSearchResults(queryHash: string): Promise<string[] | null> {
  const cached = await redis.get(`search:${queryHash}`);
  if (!cached) return null;

  const data: CachedSearchResults = JSON.parse(cached);
  return data.gameIds;
}

export async function setCachedSearchResults(queryHash: string, gameIds: string[]): Promise<void> {
  const data: CachedSearchResults = {
    gameIds,
    timestamp: Date.now(),
  };

  await redis.setEx(`search:${queryHash}`, SEARCH_CACHE_TTL, JSON.stringify(data));
}

export async function clearEmbeddingCache(key: string): Promise<void> {
  await redis.del(`embedding:${key}`);
}
```

**Step 2: Verify TypeScript**

Run:

```bash
cd backend
bun run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add backend/src/services/ai/embeddings-cache.ts
git commit -m "feat: add embeddings cache service with redis"
```

---

## Part C: Embedding Generation

### Task 9: Create Embeddings Service

**Files:**

- Create: `backend/src/services/ai/embeddings.ts`

**Step 1: Create embeddings generation service**

Create `backend/src/services/ai/embeddings.ts`:

```typescript
import { embed, embedMany } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { db } from "@/services/db";
import { games, gameEmbeddings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCachedEmbedding, setCachedEmbedding } from "./embeddings-cache";
import { decrypt } from "@/lib/crypto";
import type { AiSettings } from "@/types/ai";

const EMBEDDING_MODEL = "text-embedding-3-small";

export interface GameEmbeddingInput {
  gameId: string;
  name: string;
  genres: string[];
  description: string | null;
}

export function buildGameEmbeddingText(game: GameEmbeddingInput): string {
  const genresText = game.genres.length > 0 ? game.genres.join(", ") : "Unknown";
  const descriptionText = game.description || "No description available";

  return `Title: ${game.name}\nGenres: ${genresText}\nDescription: ${descriptionText}`;
}

export function hashText(text: string): string {
  // Simple hash for cache invalidation
  const hash = Bun.hash(text);
  return hash.toString(16);
}

export async function generateGameEmbedding(
  settings: AiSettings,
  gameId: string
): Promise<number[]> {
  // Fetch game data
  const game = await db.query.games.findFirst({
    where: eq(games.id, gameId),
    with: {
      gameGenres: {
        with: {
          genre: true,
        },
      },
    },
  });

  if (!game) {
    throw new Error(`Game not found: ${gameId}`);
  }

  // Build embedding text
  const genres = game.gameGenres.map((gg) => gg.genre.name);
  const embeddingInput: GameEmbeddingInput = {
    gameId: game.id,
    name: game.name,
    genres,
    description: game.description,
  };
  const text = buildGameEmbeddingText(embeddingInput);
  const textHash = hashText(text);

  // Check cache
  const cacheKey = `game:${gameId}:${textHash}`;
  const cached = await getCachedEmbedding(cacheKey);
  if (cached) {
    return cached;
  }

  // Generate embedding
  const apiKey = decrypt(settings.apiKeyEncrypted);
  const client = createOpenAI({
    apiKey,
    baseURL: settings.baseUrl || undefined,
  });

  const { embedding } = await embed({
    model: client.textEmbeddingModel(EMBEDDING_MODEL),
    value: text,
  });

  // Cache result
  await setCachedEmbedding(cacheKey, embedding, EMBEDDING_MODEL);

  // Store in database
  await db
    .insert(gameEmbeddings)
    .values({
      gameId,
      embedding: JSON.stringify(embedding),
      textHash,
      model: EMBEDDING_MODEL,
    })
    .onConflictDoUpdate({
      target: gameEmbeddings.gameId,
      set: {
        embedding: JSON.stringify(embedding),
        textHash,
        model: EMBEDDING_MODEL,
        updatedAt: new Date(),
      },
    });

  return embedding;
}

export async function generateGameEmbeddingsBatch(
  settings: AiSettings,
  inputs: GameEmbeddingInput[]
): Promise<number[][]> {
  if (inputs.length === 0) return [];

  // Build texts and check cache
  const texts: string[] = [];
  const textHashes: string[] = [];
  const cachedEmbeddings: (number[] | null)[] = [];

  for (const input of inputs) {
    const text = buildGameEmbeddingText(input);
    const textHash = hashText(text);
    const cacheKey = `game:${input.gameId}:${textHash}`;
    const cached = await getCachedEmbedding(cacheKey);

    texts.push(text);
    textHashes.push(textHash);
    cachedEmbeddings.push(cached);
  }

  // Generate embeddings for non-cached items
  const uncachedIndices = cachedEmbeddings
    .map((cached, idx) => (cached === null ? idx : null))
    .filter((idx): idx is number => idx !== null);

  let newEmbeddings: number[][] = [];
  if (uncachedIndices.length > 0) {
    const apiKey = decrypt(settings.apiKeyEncrypted);
    const client = createOpenAI({
      apiKey,
      baseURL: settings.baseUrl || undefined,
    });

    const uncachedTexts = uncachedIndices.map((idx) => texts[idx]);
    const { embeddings } = await embedMany({
      model: client.textEmbeddingModel(EMBEDDING_MODEL),
      values: uncachedTexts,
    });

    newEmbeddings = embeddings;

    // Cache and store new embeddings
    for (let i = 0; i < uncachedIndices.length; i++) {
      const idx = uncachedIndices[i];
      const embedding = newEmbeddings[i];
      const input = inputs[idx];
      const textHash = textHashes[idx];
      const cacheKey = `game:${input.gameId}:${textHash}`;

      await setCachedEmbedding(cacheKey, embedding, EMBEDDING_MODEL);

      await db
        .insert(gameEmbeddings)
        .values({
          gameId: input.gameId,
          embedding: JSON.stringify(embedding),
          textHash,
          model: EMBEDDING_MODEL,
        })
        .onConflictDoUpdate({
          target: gameEmbeddings.gameId,
          set: {
            embedding: JSON.stringify(embedding),
            textHash,
            model: EMBEDDING_MODEL,
            updatedAt: new Date(),
          },
        });
    }
  }

  // Combine cached and new embeddings
  const result: number[][] = [];
  let newEmbeddingIdx = 0;

  for (let i = 0; i < inputs.length; i++) {
    if (cachedEmbeddings[i] !== null) {
      result.push(cachedEmbeddings[i] as number[]);
    } else {
      result.push(newEmbeddings[newEmbeddingIdx]);
      newEmbeddingIdx++;
    }
  }

  return result;
}
```

**Step 2: Verify TypeScript**

Run:

```bash
cd backend
bun run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add backend/src/services/ai/embeddings.ts
git commit -m "feat: add embeddings generation service with caching"
```

---

### Task 10: Create Vector Search Service

**Files:**

- Create: `backend/src/services/ai/vector-search.ts`

**Step 1: Create vector search service**

Create `backend/src/services/ai/vector-search.ts`:

```typescript
import { embed } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { db } from "@/services/db";
import { gameEmbeddings, games, userGames } from "@/db/schema";
import { sql, eq, and, desc } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import type { AiSettings } from "@/types/ai";
import { getCachedSearchResults, setCachedSearchResults } from "./embeddings-cache";
import { hashText } from "./embeddings";

const EMBEDDING_MODEL = "text-embedding-3-small";

export interface SimilarGame {
  gameId: string;
  similarity: number;
  gameName: string;
  genres: string[];
}

export async function searchSimilarGames(
  settings: AiSettings,
  queryText: string,
  userId: string,
  limit: number = 50,
  minSimilarity: number = 0.6
): Promise<SimilarGame[]> {
  // Check cache
  const queryHash = hashText(`${userId}:${queryText}:${limit}:${minSimilarity}`);
  const cached = await getCachedSearchResults(queryHash);

  if (cached) {
    // Fetch full game data for cached IDs
    const results = await db
      .select({
        gameId: games.id,
        gameName: games.name,
      })
      .from(games)
      .where(sql`${games.id} = ANY(${cached})`);

    // Note: We'd need to join with genres here for full data
    // Simplified for now
    return results.map((r) => ({
      gameId: r.gameId,
      similarity: 1.0, // Cache doesn't store similarity
      gameName: r.gameName,
      genres: [],
    }));
  }

  // Generate query embedding
  const apiKey = decrypt(settings.apiKeyEncrypted);
  const client = createOpenAI({
    apiKey,
    baseURL: settings.baseUrl || undefined,
  });

  const { embedding: queryEmbedding } = await embed({
    model: client.textEmbeddingModel(EMBEDDING_MODEL),
    value: queryText,
  });

  // Vector similarity search using cosine distance
  // 1 - (embedding <=> query) gives similarity (0 to 1)
  const results = await db
    .select({
      gameId: gameEmbeddings.gameId,
      gameName: games.name,
      similarity: sql<number>`1 - (${gameEmbeddings.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`,
    })
    .from(gameEmbeddings)
    .innerJoin(games, eq(gameEmbeddings.gameId, games.id))
    .innerJoin(userGames, eq(games.id, userGames.gameId))
    .where(
      and(
        eq(userGames.userId, userId),
        sql`1 - (${gameEmbeddings.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${minSimilarity}`
      )
    )
    .orderBy(
      desc(sql`1 - (${gameEmbeddings.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`)
    )
    .limit(limit);

  // Cache results
  const gameIds = results.map((r) => r.gameId);
  await setCachedSearchResults(queryHash, gameIds);

  return results.map((r) => ({
    gameId: r.gameId,
    similarity: r.similarity,
    gameName: r.gameName,
    genres: [], // Would join with genres in real implementation
  }));
}
```

**Step 2: Verify TypeScript**

Run:

```bash
cd backend
bun run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add backend/src/services/ai/vector-search.ts
git commit -m "feat: add vector similarity search service"
```

---

### Task 11: Create Embedding Jobs Service

**Files:**

- Create: `backend/src/services/ai/embedding-jobs.ts`

**Step 1: Create background jobs service**

Create `backend/src/services/ai/embedding-jobs.ts`:

```typescript
import { db } from "@/services/db";
import { games, gameEmbeddings, userGames } from "@/db/schema";
import { eq, sql, isNull } from "drizzle-orm";
import { generateGameEmbeddingsBatch } from "./embeddings";
import type { AiSettings } from "@/types/ai";
import type { GameEmbeddingInput } from "./embeddings";

export interface EmbeddingJobResult {
  processed: number;
  cached: number;
  generated: number;
  errors: number;
}

export async function checkUserHasEmbeddings(userId: string): Promise<boolean> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(userGames)
    .innerJoin(gameEmbeddings, eq(userGames.gameId, gameEmbeddings.gameId))
    .where(eq(userGames.userId, userId));

  return Number(result[0]?.count ?? 0) > 0;
}

export async function generateMissingGameEmbeddings(
  settings: AiSettings,
  batchSize: number = 100
): Promise<EmbeddingJobResult> {
  const result: EmbeddingJobResult = {
    processed: 0,
    cached: 0,
    generated: 0,
    errors: 0,
  };

  // Find games without embeddings
  const gamesWithoutEmbeddings = await db
    .select({
      id: games.id,
      name: games.name,
      description: games.description,
    })
    .from(games)
    .leftJoin(gameEmbeddings, eq(games.id, gameEmbeddings.gameId))
    .where(isNull(gameEmbeddings.id))
    .limit(batchSize);

  if (gamesWithoutEmbeddings.length === 0) {
    return result;
  }

  // Fetch genres for these games
  const gameIds = gamesWithoutEmbeddings.map((g) => g.id);
  const gamesWithGenres = await db.query.games.findMany({
    where: sql`${games.id} = ANY(${gameIds})`,
    with: {
      gameGenres: {
        with: {
          genre: true,
        },
      },
    },
  });

  // Build inputs
  const inputs: GameEmbeddingInput[] = gamesWithGenres.map((game) => ({
    gameId: game.id,
    name: game.name,
    genres: game.gameGenres.map((gg) => gg.genre.name),
    description: game.description,
  }));

  // Generate embeddings in batch
  try {
    await generateGameEmbeddingsBatch(settings, inputs);
    result.processed = inputs.length;
    result.generated = inputs.length;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    result.errors = inputs.length;
  }

  return result;
}

export async function generateUserLibraryEmbeddings(
  settings: AiSettings,
  userId: string,
  batchSize: number = 100
): Promise<EmbeddingJobResult> {
  const result: EmbeddingJobResult = {
    processed: 0,
    cached: 0,
    generated: 0,
    errors: 0,
  };

  // Find user's games without embeddings
  const userGamesWithoutEmbeddings = await db
    .select({
      id: games.id,
      name: games.name,
      description: games.description,
    })
    .from(games)
    .innerJoin(userGames, eq(games.id, userGames.gameId))
    .leftJoin(gameEmbeddings, eq(games.id, gameEmbeddings.gameId))
    .where(and(eq(userGames.userId, userId), isNull(gameEmbeddings.id)))
    .limit(batchSize);

  if (userGamesWithoutEmbeddings.length === 0) {
    return result;
  }

  // Fetch genres
  const gameIds = userGamesWithoutEmbeddings.map((g) => g.id);
  const gamesWithGenres = await db.query.games.findMany({
    where: sql`${games.id} = ANY(${gameIds})`,
    with: {
      gameGenres: {
        with: {
          genre: true,
        },
      },
    },
  });

  // Build inputs
  const inputs: GameEmbeddingInput[] = gamesWithGenres.map((game) => ({
    gameId: game.id,
    name: game.name,
    genres: game.gameGenres.map((gg) => gg.genre.name),
    description: game.description,
  }));

  // Generate embeddings
  try {
    await generateGameEmbeddingsBatch(settings, inputs);
    result.processed = inputs.length;
    result.generated = inputs.length;
  } catch (error) {
    console.error("Error generating user library embeddings:", error);
    result.errors = inputs.length;
  }

  return result;
}
```

**Step 2: Verify TypeScript**

Run:

```bash
cd backend
bun run typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add backend/src/services/ai/embedding-jobs.ts
git commit -m "feat: add embedding background jobs service"
```

---

## Part D: API Integration

### Task 12: Add Embeddings API Endpoint

**Files:**

- Modify: `backend/src/routes/ai.ts`

**Step 1: Add embeddings generation endpoint**

Add to `backend/src/routes/ai.ts` (before the final export):

```typescript
import {
  generateMissingGameEmbeddings,
  generateUserLibraryEmbeddings,
} from "@/services/ai/embedding-jobs";

// ... existing imports and routes

router.post(
  "/api/ai/embeddings/generate",
  requireAuth(async (req, user) => {
    const settings = await getUserAiSettings(user.id);

    if (!settings) {
      return new Response(JSON.stringify({ error: "AI settings not configured" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const batchSize = body.batchSize ?? 100;
    const userLibraryOnly = body.userLibraryOnly ?? false;

    const result = userLibraryOnly
      ? await generateUserLibraryEmbeddings(settings, user.id, batchSize)
      : await generateMissingGameEmbeddings(settings, batchSize);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  })
);

router.get(
  "/api/ai/embeddings/status",
  requireAuth(async (req, user) => {
    const hasEmbeddings = await checkUserHasEmbeddings(user.id);

    return new Response(
      JSON.stringify({
        hasEmbeddings,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  })
);
```

**Step 2: Add missing import**

Add import at top of file:

```typescript
import { checkUserHasEmbeddings } from "@/services/ai/embedding-jobs";
```

**Step 3: Verify TypeScript**

Run:

```bash
cd backend
bun run typecheck
```

Expected: PASS

**Step 4: Verify lint**

Run:

```bash
cd backend
bun run lint
```

Expected: PASS (no warnings)

**Step 5: Commit**

```bash
git add backend/src/routes/ai.ts
git commit -m "feat: add embeddings generation api endpoints"
```

---

## Part E: Manual Testing

### Task 13: Manual Integration Testing

**Files:**

- None (manual testing only)

**Step 1: Start development environment**

Run:

```bash
# Terminal 1: Start infrastructure
make dev

# Terminal 2: Start backend
cd backend
bun run dev
```

Expected: Backend running on :3000, connected to PostgreSQL and Redis

**Step 2: Verify database migrations**

Run:

```bash
psql postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard -c "\dx vector"
psql postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard -c "\dt *embeddings"
```

Expected:

- vector extension enabled
- 4 embedding tables listed

**Step 3: Test embeddings status endpoint**

```bash
# Login to get JWT token first
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USERNAME","password":"YOUR_PASSWORD"}' \
  | jq -r '.token')

# Check embeddings status
curl -s http://localhost:3000/api/ai/embeddings/status \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

Expected: `{"hasEmbeddings": false}` (if no embeddings generated yet)

**Step 4: Test embeddings generation endpoint**

```bash
curl -s -X POST http://localhost:3000/api/ai/embeddings/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 10, "userLibraryOnly": true}' \
  | jq
```

Expected:

```json
{
  "processed": 10,
  "cached": 0,
  "generated": 10,
  "errors": 0
}
```

**Step 5: Verify embeddings in database**

```bash
psql postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard \
  -c "SELECT COUNT(*) FROM game_embeddings;"
```

Expected: Count > 0

**Step 6: Verify Redis cache**

```bash
redis-cli -p 6380 KEYS "embedding:*"
```

Expected: List of cache keys

**Step 7: Test vector search (manual SQL)**

```bash
psql postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard -c "
SELECT g.name,
       1 - (ge.embedding <=> (SELECT embedding FROM game_embeddings LIMIT 1)) as similarity
FROM game_embeddings ge
JOIN games g ON ge.game_id = g.id
ORDER BY similarity DESC
LIMIT 5;
"
```

Expected: List of 5 games with similarity scores

**Step 8: Verify typecheck and lint**

```bash
cd backend
bun run typecheck
bun run lint
```

Expected: PASS (no errors or warnings)

**Step 9: Document testing results**

Create file: `backend/docs/testing/embeddings-phase2-results.md`

Document:

- Embeddings generated count
- Cache hit rates
- Query performance
- Any issues encountered

---

## Success Criteria

- [ ] pgvector extension enabled
- [ ] 4 embedding tables created with HNSW indexes
- [ ] Embeddings cache service functional
- [ ] Single and batch embedding generation working
- [ ] Vector similarity search returning results
- [ ] API endpoints responding correctly
- [ ] Redis caching reducing API calls
- [ ] TypeScript compilation passes
- [ ] ESLint passes with zero warnings
- [ ] Manual testing confirms functionality

---

## Rollback Plan

If issues occur during Phase 2:

```sql
-- Connect to database
psql postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard

-- Drop embedding tables
DROP TABLE IF EXISTS user_preference_embeddings CASCADE;
DROP TABLE IF EXISTS achievement_embeddings CASCADE;
DROP TABLE IF EXISTS collection_embeddings CASCADE;
DROP TABLE IF EXISTS game_embeddings CASCADE;

-- Disable pgvector extension
DROP EXTENSION IF EXISTS vector CASCADE;
```

Then:

```bash
cd backend
git checkout HEAD -- src/db/schema.ts
git checkout HEAD -- src/services/ai/
bun install
bun run db:generate
bun run db:migrate
```

Phase 1 functionality remains intact.

---

## Next Steps

After Phase 2 completion:

- Phase 3: Integrate RAG into AI service (semantic filtering)
- Phase 4: Add smart model routing
