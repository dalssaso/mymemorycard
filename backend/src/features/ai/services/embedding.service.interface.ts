export interface IEmbeddingService {
  generateGameEmbedding(userId: string, gameId: string, gameText: string): Promise<void>;
  generateCollectionEmbedding(
    userId: string,
    collectionId: string,
    collectionText: string
  ): Promise<void>;
  findSimilarGames(userId: string, gameId: string, limit: number): Promise<string[]>;
  findSimilarCollections(userId: string, collectionId: string, limit: number): Promise<string[]>;
}
