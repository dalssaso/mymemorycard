import { embed, embedMany } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { db } from "@/db"
import { games, gameEmbeddings, gameGenres, genres } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getCachedEmbedding, setCachedEmbedding } from "./embeddings-cache"
import { decrypt } from "@/lib/encryption"

const EMBEDDING_MODEL = "text-embedding-3-small"

interface AiSettings {
  provider: string
  baseUrl: string | null
  apiKeyEncrypted: string | null
  model: string
  imageApiKeyEncrypted: string | null
  imageModel: string | null
  temperature: number
  maxTokens: number
  enabled: boolean
}

export interface GameEmbeddingInput {
  gameId: string
  name: string
  genres: string[]
  description: string | null
}

function buildGameEmbeddingText(game: GameEmbeddingInput): string {
  const parts: string[] = []

  parts.push(`Game: ${game.name}`)

  if (game.genres.length > 0) {
    parts.push(`Genres: ${game.genres.join(", ")}`)
  }

  if (game.description) {
    parts.push(`Description: ${game.description}`)
  }

  return parts.join("\n")
}

export function hashText(text: string): string {
  return Bun.hash(text).toString(16)
}

export async function generateGameEmbedding(
  settings: AiSettings,
  gameId: string
): Promise<number[]> {
  const gameData = await db
    .select({
      id: games.id,
      name: games.name,
      description: games.description,
      genreName: genres.name,
    })
    .from(games)
    .leftJoin(gameGenres, eq(games.id, gameGenres.gameId))
    .leftJoin(genres, eq(gameGenres.genreId, genres.id))
    .where(eq(games.id, gameId))

  if (gameData.length === 0) {
    throw new Error(`Game not found: ${gameId}`)
  }

  const firstRow = gameData[0]
  const genreNames = gameData
    .map((row) => row.genreName)
    .filter((name): name is string => name !== null)

  const input: GameEmbeddingInput = {
    gameId: firstRow.id,
    name: firstRow.name,
    genres: genreNames,
    description: firstRow.description,
  }

  const text = buildGameEmbeddingText(input)
  const textHash = hashText(text)
  const cacheKey = `game:${gameId}:${textHash}`

  const cached = await getCachedEmbedding(cacheKey)
  if (cached) {
    return cached
  }

  if (!settings.apiKeyEncrypted) {
    throw new Error("API key is required for embedding generation")
  }

  const apiKey = decrypt(settings.apiKeyEncrypted)
  const openai = createOpenAI({
    apiKey,
    baseURL: settings.baseUrl || undefined,
  })

  const { embedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: text,
  })

  await db
    .insert(gameEmbeddings)
    .values({
      gameId,
      embedding,
      textHash,
      model: EMBEDDING_MODEL,
    })
    .onConflictDoUpdate({
      target: gameEmbeddings.gameId,
      set: {
        embedding,
        textHash,
        model: EMBEDDING_MODEL,
        updatedAt: new Date(),
      },
    })

  await setCachedEmbedding(cacheKey, embedding, EMBEDDING_MODEL)

  return embedding
}

export async function generateGameEmbeddingsBatch(
  settings: AiSettings,
  inputs: GameEmbeddingInput[]
): Promise<number[][]> {
  const uncachedInputs: GameEmbeddingInput[] = []
  const cachedResults: Map<string, number[]> = new Map()
  const gameIdOrder: string[] = []

  for (const input of inputs) {
    gameIdOrder.push(input.gameId)
    const text = buildGameEmbeddingText(input)
    const textHash = hashText(text)
    const cacheKey = `game:${input.gameId}:${textHash}`

    const cached = await getCachedEmbedding(cacheKey)
    if (cached) {
      cachedResults.set(input.gameId, cached)
    } else {
      uncachedInputs.push(input)
    }
  }

  if (uncachedInputs.length > 0) {
    if (!settings.apiKeyEncrypted) {
      throw new Error("API key is required for embedding generation")
    }

    const apiKey = decrypt(settings.apiKeyEncrypted)
    const openai = createOpenAI({
      apiKey,
      baseURL: settings.baseUrl || undefined,
    })

    const texts = uncachedInputs.map((input) => buildGameEmbeddingText(input))
    const { embeddings } = await embedMany({
      model: openai.embedding(EMBEDDING_MODEL),
      values: texts,
    })

    for (let i = 0; i < uncachedInputs.length; i++) {
      const input = uncachedInputs[i]
      const embedding = embeddings[i]
      const text = texts[i]
      const textHash = hashText(text)
      const cacheKey = `game:${input.gameId}:${textHash}`

      await db
        .insert(gameEmbeddings)
        .values({
          gameId: input.gameId,
          embedding,
          textHash,
          model: EMBEDDING_MODEL,
        })
        .onConflictDoUpdate({
          target: gameEmbeddings.gameId,
          set: {
            embedding,
            textHash,
            model: EMBEDDING_MODEL,
            updatedAt: new Date(),
          },
        })

      await setCachedEmbedding(cacheKey, embedding, EMBEDDING_MODEL)
      cachedResults.set(input.gameId, embedding)
    }
  }

  return gameIdOrder.map((gameId) => {
    const result = cachedResults.get(gameId)
    if (!result) {
      throw new Error(`Embedding not found for game: ${gameId}`)
    }
    return result
  })
}
