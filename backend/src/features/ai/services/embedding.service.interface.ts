/**
 * Service for managing game and collection embeddings using AI models.
 * Provides semantic search capabilities through vector similarity.
 */
export interface IEmbeddingService {
  /**
   * Generates and saves an embedding for a game's text content.
   *
   * @param userId - ID of the user who owns the AI settings
   * @param gameId - ID of the game to generate embedding for
   * @param gameText - Text content to embed (e.g., game description, tags)
   * @returns Promise that resolves when embedding is generated and saved
   */
  generateGameEmbedding(userId: string, gameId: string, gameText: string): Promise<void>;
  /**
   * Generates and saves an embedding for a collection's text content.
   *
   * @param userId - ID of the user who owns the AI settings
   * @param collectionId - ID of the collection to generate embedding for
   * @param collectionText - Text content to embed (e.g., collection name, description)
   * @returns Promise that resolves when embedding is generated and saved
   */
  generateCollectionEmbedding(
    userId: string,
    collectionId: string,
    collectionText: string
  ): Promise<void>;
  /**
   * Finds games similar to a given game using semantic similarity.
   *
   * @param userId - ID of the user who owns the AI settings
   * @param gameId - ID of the game to find similar games for
   * @param limit - Maximum number of similar games to return (will be clamped 1-100)
   * @returns Promise resolving to array of game IDs, ordered by similarity (most similar first)
   */
  findSimilarGames(userId: string, gameId: string, limit: number): Promise<string[]>;
  /**
   * Finds collections similar to a given collection using semantic similarity, excluding the
   * source collection from results.
   *
   * @param userId - ID of the user who owns the AI settings
   * @param collectionId - ID of the collection to find similar collections for
   * @param limit - Maximum number of similar collections to return (will be clamped 1-100)
   * @returns Promise resolving to array of collection IDs, ordered by similarity (most similar first)
   */
  findSimilarCollections(userId: string, collectionId: string, limit: number): Promise<string[]>;
}
