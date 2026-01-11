import type { CollectionEmbedding, GameEmbedding } from "../types";

export interface IEmbeddingRepository {
  findByGameId(gameId: string): Promise<GameEmbedding | null>;
  findByCollectionId(collectionId: string): Promise<CollectionEmbedding | null>;
  saveGameEmbedding(gameId: string, embedding: number[], model: string): Promise<void>;
  saveCollectionEmbedding(collectionId: string, embedding: number[], model: string): Promise<void>;
  findSimilarGames(embedding: number[], limit: number, excludeIds?: string[]): Promise<string[]>;
  findSimilarCollections(embedding: number[], limit: number): Promise<string[]>;
}
