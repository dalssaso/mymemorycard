import { db } from "@/db";
import { games, gameEmbeddings, userGames, gameGenres, genres } from "@/db/schema";
import { eq, sql, isNull, and, inArray } from "drizzle-orm";
import { generateGameEmbeddingsBatch, type GameEmbeddingInput } from "./embeddings";

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

export interface EmbeddingJobResult {
  processed: number;
  cached: number;
  generated: number;
  errors: number;
}

export async function checkUserHasEmbeddings(userId: string): Promise<boolean> {
  const result = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(userGames)
    .innerJoin(gameEmbeddings, eq(userGames.gameId, gameEmbeddings.gameId))
    .where(eq(userGames.userId, userId));

  return result[0]?.count > 0;
}

export async function generateMissingGameEmbeddings(
  settings: AiSettings,
  batchSize = 100
): Promise<EmbeddingJobResult> {
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
    return { processed: 0, cached: 0, generated: 0, errors: 0 };
  }

  const gameIds = gamesWithoutEmbeddings.map((g) => g.id);

  const genreData = await db
    .select({
      gameId: gameGenres.gameId,
      genreName: genres.name,
    })
    .from(gameGenres)
    .innerJoin(genres, eq(gameGenres.genreId, genres.id))
    .where(inArray(gameGenres.gameId, gameIds));

  const genresByGame = new Map<string, string[]>();
  for (const row of genreData) {
    if (!genresByGame.has(row.gameId)) {
      genresByGame.set(row.gameId, []);
    }
    genresByGame.get(row.gameId)!.push(row.genreName);
  }

  const inputs: GameEmbeddingInput[] = gamesWithoutEmbeddings.map((g) => ({
    gameId: g.id,
    name: g.name,
    genres: genresByGame.get(g.id) || [],
    description: g.description,
  }));

  try {
    await generateGameEmbeddingsBatch(settings, inputs);
    return {
      processed: inputs.length,
      cached: 0,
      generated: inputs.length,
      errors: 0,
    };
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return {
      processed: inputs.length,
      cached: 0,
      generated: 0,
      errors: inputs.length,
    };
  }
}

export async function generateUserLibraryEmbeddings(
  settings: AiSettings,
  userId: string,
  batchSize = 100
): Promise<EmbeddingJobResult> {
  const userGamesWithoutEmbeddings = await db
    .select({
      id: games.id,
      name: games.name,
      description: games.description,
    })
    .from(userGames)
    .innerJoin(games, eq(userGames.gameId, games.id))
    .leftJoin(gameEmbeddings, eq(games.id, gameEmbeddings.gameId))
    .where(and(eq(userGames.userId, userId), isNull(gameEmbeddings.id)))
    .limit(batchSize);

  if (userGamesWithoutEmbeddings.length === 0) {
    return { processed: 0, cached: 0, generated: 0, errors: 0 };
  }

  const gameIds = userGamesWithoutEmbeddings.map((g) => g.id);

  const genreData = await db
    .select({
      gameId: gameGenres.gameId,
      genreName: genres.name,
    })
    .from(gameGenres)
    .innerJoin(genres, eq(gameGenres.genreId, genres.id))
    .where(inArray(gameGenres.gameId, gameIds));

  const genresByGame = new Map<string, string[]>();
  for (const row of genreData) {
    if (!genresByGame.has(row.gameId)) {
      genresByGame.set(row.gameId, []);
    }
    genresByGame.get(row.gameId)!.push(row.genreName);
  }

  const inputs: GameEmbeddingInput[] = userGamesWithoutEmbeddings.map((g) => ({
    gameId: g.id,
    name: g.name,
    genres: genresByGame.get(g.id) || [],
    description: g.description,
  }));

  try {
    await generateGameEmbeddingsBatch(settings, inputs);
    return {
      processed: inputs.length,
      cached: 0,
      generated: inputs.length,
      errors: 0,
    };
  } catch (error) {
    console.error("Error generating user library embeddings:", error);
    return {
      processed: inputs.length,
      cached: 0,
      generated: 0,
      errors: inputs.length,
    };
  }
}
