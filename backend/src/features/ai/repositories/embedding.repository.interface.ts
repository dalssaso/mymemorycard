import type { CollectionEmbedding, GameEmbedding } from "../types";

export interface IEmbeddingRepository {
  /**
   * Find a game embedding by game ID.
   *
   * @param gameId - The ID of the game to find the embedding for
   * @returns The game embedding if found, null otherwise
   */
  findByGameId(gameId: string): Promise<GameEmbedding | null>;

  /**
   * Find a collection embedding by collection ID.
   *
   * @param collectionId - The ID of the collection to find the embedding for
   * @returns The collection embedding if found, null otherwise
   */
  findByCollectionId(collectionId: string): Promise<CollectionEmbedding | null>;

  /**
   * Save or update a game embedding.
   *
   * @param gameId - The ID of the game to save the embedding for
   * @param embedding - The embedding vector (1536 dimensions)
   * @param model - The embedding model used (e.g., "text-embedding-3-small")
   * @param textHash - Hash of the text used to generate the embedding
   */
  saveGameEmbedding(
    gameId: string,
    embedding: number[],
    model: string,
    textHash: string
  ): Promise<void>;

  /**
   * Save or update a collection embedding.
   *
   * @param collectionId - The ID of the collection to save the embedding for
   * @param embedding - The embedding vector (1536 dimensions)
   * @param model - The embedding model used (e.g., "text-embedding-3-small")
   * @param textHash - Hash of the text used to generate the embedding
   */
  saveCollectionEmbedding(
    collectionId: string,
    embedding: number[],
    model: string,
    textHash: string
  ): Promise<void>;

  /**
   * Find games with similar embeddings using cosine distance.
   *
   * @param embedding - The query embedding vector (1536 dimensions)
   * @param limit - Maximum number of similar games to return
   * @param excludeIds - Optional array of game IDs to exclude from results
   * @returns Array of game IDs ordered by similarity (most similar first)
   */
  findSimilarGames(embedding: number[], limit: number, excludeIds?: string[]): Promise<string[]>;

  /**
   * Find collections with similar embeddings using cosine distance.
   *
   * @param embedding - The query embedding vector (1536 dimensions)
   * @param limit - Maximum number of similar collections to return
   * @returns Array of collection IDs ordered by similarity (most similar first)
   */
  findSimilarCollections(embedding: number[], limit: number): Promise<string[]>;
}
