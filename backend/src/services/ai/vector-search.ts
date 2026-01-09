import { embed } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { db } from "@/db"
import { gameEmbeddings, games, userGames } from "@/db/schema"
import { sql, eq, and, desc } from "drizzle-orm"
import { decrypt } from "@/lib/encryption"
import {
  getCachedSearchResults,
  setCachedSearchResults,
} from "./embeddings-cache"
import { hashText } from "./embeddings"

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

export interface SimilarGame {
  gameId: string
  similarity: number
  gameName: string
  genres: string[]
}

export async function searchSimilarGames(
  settings: AiSettings,
  queryText: string,
  userId: string,
  limit = 50,
  minSimilarity = 0.6
): Promise<SimilarGame[]> {
  const queryHash = hashText(queryText)

  const cachedGameIds = await getCachedSearchResults(queryHash)
  if (cachedGameIds) {
    const cachedGames = await db
      .select({
        gameId: gameEmbeddings.gameId,
        similarity: sql<number>`1`,
        gameName: games.name,
      })
      .from(gameEmbeddings)
      .innerJoin(games, eq(gameEmbeddings.gameId, games.id))
      .innerJoin(userGames, eq(games.id, userGames.gameId))
      .where(
        and(
          eq(userGames.userId, userId),
          sql`${gameEmbeddings.gameId} = ANY(${cachedGameIds})`
        )
      )
      .limit(limit)

    return cachedGames.map((game) => ({
      gameId: game.gameId,
      similarity: game.similarity,
      gameName: game.gameName,
      genres: [],
    }))
  }

  if (!settings.apiKeyEncrypted) {
    throw new Error("API key is required for vector search")
  }

  const apiKey = decrypt(settings.apiKeyEncrypted)
  const openai = createOpenAI({
    apiKey,
    baseURL: settings.baseUrl || undefined,
  })

  const { embedding: queryEmbedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: queryText,
  })

  const results = await db
    .select({
      gameId: gameEmbeddings.gameId,
      similarity: sql<number>`1 - (${gameEmbeddings.embedding} <=> ${sql`${JSON.stringify(queryEmbedding)}::vector`})`,
      gameName: games.name,
    })
    .from(gameEmbeddings)
    .innerJoin(games, eq(gameEmbeddings.gameId, games.id))
    .innerJoin(userGames, eq(games.id, userGames.gameId))
    .where(
      and(
        eq(userGames.userId, userId),
        sql`1 - (${gameEmbeddings.embedding} <=> ${sql`${JSON.stringify(queryEmbedding)}::vector`}) >= ${minSimilarity}`
      )
    )
    .orderBy(desc(sql`1 - (${gameEmbeddings.embedding} <=> ${sql`${JSON.stringify(queryEmbedding)}::vector`})`))
    .limit(limit)

  const gameIds = results.map((r) => r.gameId)
  await setCachedSearchResults(queryHash, gameIds)

  return results.map((result) => ({
    gameId: result.gameId,
    similarity: result.similarity,
    gameName: result.gameName,
    genres: [],
  }))
}
