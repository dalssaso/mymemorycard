import crypto from "crypto"
import { eq, notInArray, sql } from "drizzle-orm"
import { injectable, inject } from "tsyringe"

import { collectionEmbeddings, gameEmbeddings } from "@/db/schema"
import type { DrizzleDB } from "@/infrastructure/database/connection"

import type { CollectionEmbedding, GameEmbedding } from "../types"
import type { IEmbeddingRepository } from "./embedding.repository.interface"

@injectable()
export class EmbeddingRepository implements IEmbeddingRepository {
  constructor(@inject("Database") private db: DrizzleDB) {}

  async findByGameId(gameId: string): Promise<GameEmbedding | null> {
    const result = await this.db
      .select()
      .from(gameEmbeddings)
      .where(eq(gameEmbeddings.gameId, gameId))
      .limit(1)

    return result[0] ?? null
  }

  async findByCollectionId(collectionId: string): Promise<CollectionEmbedding | null> {
    const result = await this.db
      .select()
      .from(collectionEmbeddings)
      .where(eq(collectionEmbeddings.collectionId, collectionId))
      .limit(1)

    return result[0] ?? null
  }

  async saveGameEmbedding(gameId: string, embedding: number[], model: string): Promise<void> {
    const textHash = crypto.createHash("sha256").update(gameId).digest("hex")

    await this.db
      .insert(gameEmbeddings)
      .values({
        gameId,
        embedding,
        textHash,
        model,
      })
      .onConflictDoUpdate({
        target: gameEmbeddings.gameId,
        set: {
          embedding,
          textHash,
          model,
          updatedAt: new Date(),
        },
      })
  }

  async saveCollectionEmbedding(
    collectionId: string,
    embedding: number[],
    model: string
  ): Promise<void> {
    const textHash = crypto.createHash("sha256").update(collectionId).digest("hex")

    await this.db
      .insert(collectionEmbeddings)
      .values({
        collectionId,
        embedding,
        textHash,
        model,
      })
      .onConflictDoUpdate({
        target: collectionEmbeddings.collectionId,
        set: {
          embedding,
          textHash,
          model,
          updatedAt: new Date(),
        },
      })
  }

  async findSimilarGames(
    embedding: number[],
    limit: number,
    excludeIds: string[] = []
  ): Promise<string[]> {
    const vectorString = `[${embedding.join(",")}]`

    let query = this.db
      .select({ gameId: gameEmbeddings.gameId })
      .from(gameEmbeddings)
      .orderBy(sql`embedding <=> ${vectorString}::vector`)
      .limit(limit)

    if (excludeIds.length > 0) {
      query = query.where(notInArray(gameEmbeddings.gameId, excludeIds)) as typeof query
    }

    const results = await query

    return results.map((r) => r.gameId)
  }

  async findSimilarCollections(embedding: number[], limit: number): Promise<string[]> {
    const vectorString = `[${embedding.join(",")}]`

    const results = await this.db
      .select({ collectionId: collectionEmbeddings.collectionId })
      .from(collectionEmbeddings)
      .orderBy(sql`embedding <=> ${vectorString}::vector`)
      .limit(limit)

    return results.map((r) => r.collectionId)
  }
}
