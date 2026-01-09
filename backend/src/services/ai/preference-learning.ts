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
import type { GameSummary } from "./prompts";

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
      avgRating: sql<number>`AVG(${userGameProgress.userRating})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(userGameProgress)
    .innerJoin(
      userGames,
      and(
        eq(userGameProgress.userId, userGames.userId),
        eq(userGameProgress.gameId, userGames.gameId),
        eq(userGameProgress.platformId, userGames.platformId)
      )
    )
    .innerJoin(games, eq(userGames.gameId, games.id))
    .innerJoin(gameGenres, eq(games.id, gameGenres.gameId))
    .innerJoin(genres, eq(gameGenres.genreId, genres.id))
    .where(and(eq(userGameProgress.userId, userId), gte(userGameProgress.userRating, 8)))
    .groupBy(genres.name)
    .having(sql`COUNT(*) >= 3`)
    .orderBy(sql`AVG(${userGameProgress.userRating}) DESC`)
    .limit(3);

  // Fetch games for each preferred genre
  for (const genreRating of genreRatings) {
    const genreGames = await db
      .select({
        id: games.id,
        name: games.name,
        rating: userGameProgress.userRating,
      })
      .from(userGameProgress)
      .innerJoin(
        userGames,
        and(
          eq(userGameProgress.userId, userGames.userId),
          eq(userGameProgress.gameId, userGames.gameId),
          eq(userGameProgress.platformId, userGames.platformId)
        )
      )
      .innerJoin(games, eq(userGames.gameId, games.id))
      .innerJoin(gameGenres, eq(games.id, gameGenres.gameId))
      .innerJoin(genres, eq(gameGenres.genreId, genres.id))
      .where(
        and(
          eq(userGameProgress.userId, userId),
          eq(genres.name, genreRating.genreName),
          gte(userGameProgress.userRating, 8)
        )
      )
      .limit(5);

    // Get genres for each game
    const gameIds = genreGames.map((g) => g.id);
    const gameGenreData = await db
      .select({
        gameId: gameGenres.gameId,
        genreName: genres.name,
      })
      .from(gameGenres)
      .innerJoin(genres, eq(gameGenres.genreId, genres.id))
      .where(sql`${gameGenres.gameId} = ANY(${gameIds})`);

    // Group genres by game
    const genresByGame = new Map<string, string[]>();
    for (const row of gameGenreData) {
      if (!genresByGame.has(row.gameId)) {
        genresByGame.set(row.gameId, []);
      }
      genresByGame.get(row.gameId)!.push(row.genreName);
    }

    preferences.push({
      type: `genre_${genreRating.genreName.toLowerCase().replace(/\s+/g, "_")}`,
      games: genreGames.map((g) => ({
        id: g.id,
        name: g.name,
        genres: genresByGame.get(g.id) ?? [],
        status: "completed",
        rating: g.rating,
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
    .innerJoin(
      userGames,
      and(
        eq(userGameProgress.userId, userGames.userId),
        eq(userGameProgress.gameId, userGames.gameId),
        eq(userGameProgress.platformId, userGames.platformId)
      )
    )
    .innerJoin(games, eq(userGames.gameId, games.id))
    .where(and(eq(userGameProgress.userId, userId), eq(userGameProgress.status, "completed")))
    .limit(10);

  if (completedGames.length >= 3) {
    // Get genres for completed games
    const gameIds = completedGames.map((g) => g.id);
    const gameGenreData = await db
      .select({
        gameId: gameGenres.gameId,
        genreName: genres.name,
      })
      .from(gameGenres)
      .innerJoin(genres, eq(gameGenres.genreId, genres.id))
      .where(sql`${gameGenres.gameId} = ANY(${gameIds})`);

    // Group genres by game
    const genresByGame = new Map<string, string[]>();
    for (const row of gameGenreData) {
      if (!genresByGame.has(row.gameId)) {
        genresByGame.set(row.gameId, []);
      }
      genresByGame.get(row.gameId)!.push(row.genreName);
    }

    preferences.push({
      type: "completed_themes",
      games: completedGames.map((g) => ({
        id: g.id,
        name: g.name,
        genres: genresByGame.get(g.id) ?? [],
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
      model: openai.embedding(EMBEDDING_MODEL),
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
