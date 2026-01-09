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
      model: openai.embedding(EMBEDDING_MODEL),
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
    model: openai.embedding(EMBEDDING_MODEL),
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
