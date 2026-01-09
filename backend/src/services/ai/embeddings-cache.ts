import redis from "@/services/redis";

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
