import { createHash } from "crypto";
import { injectable, inject } from "tsyringe";

import type { IEmbeddingService } from "./embedding.service.interface";
import type { IGatewayService } from "./gateway.service.interface";
import type { IEmbeddingRepository } from "../repositories/embedding.repository.interface";
import type { IAiSettingsRepository } from "../repositories/ai-settings.repository.interface";
import { ConfigurationError } from "../errors/configuration.error";

@injectable()
export class EmbeddingService implements IEmbeddingService {
  constructor(
    @inject("IGatewayService") private gateway: IGatewayService,
    @inject("IEmbeddingRepository") private embeddingRepo: IEmbeddingRepository,
    @inject("IAiSettingsRepository") private settingsRepo: IAiSettingsRepository
  ) {}

  /**
   * Generates and saves an embedding for a game's text content.
   *
   * Creates a SHA-256 hash of the input text and generates an embedding vector
   * using the configured AI provider. The embedding is then saved to the database
   * with the hash for deduplication purposes.
   *
   * @param userId - ID of the user who owns the AI settings
   * @param gameId - ID of the game to generate embedding for
   * @param gameText - Text content to embed (e.g., game description, tags)
   * @returns Promise that resolves when embedding is generated and saved
   * @throws {ConfigurationError} If AI settings are not configured for the user
   */
  async generateGameEmbedding(userId: string, gameId: string, gameText: string): Promise<void> {
    const config = await this.settingsRepo.getGatewayConfig(userId);
    if (!config) {
      throw new ConfigurationError("AI settings not configured");
    }

    const textHash = createHash("sha256").update(gameText).digest("hex");
    const result = await this.gateway.generateEmbedding(gameText, config);
    await this.embeddingRepo.saveGameEmbedding(gameId, result.embedding, result.model, textHash);
  }

  /**
   * Generates and saves an embedding for a collection's text content.
   *
   * Creates a SHA-256 hash of the input text and generates an embedding vector
   * using the configured AI provider. The embedding is then saved to the database
   * with the hash for deduplication purposes.
   *
   * @param userId - ID of the user who owns the AI settings
   * @param collectionId - ID of the collection to generate embedding for
   * @param collectionText - Text content to embed (e.g., collection name, description)
   * @returns Promise that resolves when embedding is generated and saved
   * @throws {ConfigurationError} If AI settings are not configured for the user
   */
  async generateCollectionEmbedding(
    userId: string,
    collectionId: string,
    collectionText: string
  ): Promise<void> {
    const config = await this.settingsRepo.getGatewayConfig(userId);
    if (!config) {
      throw new ConfigurationError("AI settings not configured");
    }

    const textHash = createHash("sha256").update(collectionText).digest("hex");
    const result = await this.gateway.generateEmbedding(collectionText, config);
    await this.embeddingRepo.saveCollectionEmbedding(
      collectionId,
      result.embedding,
      result.model,
      textHash
    );
  }

  /**
   * Finds games similar to a given game using semantic similarity.
   *
   * Retrieves the embedding for the specified game and performs a vector similarity
   * search to find other games with similar embeddings. The limit is clamped between
   * 1-100 for performance and safety. The source game is excluded from results.
   *
   * @param _userId - ID of the user (reserved for future authorization checks)
   * @param gameId - ID of the game to find similar games for
   * @param limit - Maximum number of similar games to return (will be clamped 1-100)
   * @returns Promise resolving to array of game IDs, ordered by similarity (most similar first)
   */
  async findSimilarGames(_userId: string, gameId: string, limit: number): Promise<string[]> {
    // Clamp limit defensively (even though controller validates)
    const clampedLimit = Math.min(Math.max(limit, 1), 100);

    const record = await this.embeddingRepo.findByGameId(gameId);
    if (!record?.embedding) {
      return [];
    }

    const embedding = record.embedding;
    return this.embeddingRepo.findSimilarGames(embedding, clampedLimit, [gameId]);
  }

  /**
   * Finds collections similar to a given collection using semantic similarity.
   *
   * Retrieves the embedding for the specified collection and performs a vector similarity
   * search to find other collections with similar embeddings, excluding the source
   * collection. The limit is clamped between 1-100 for performance and safety.
   *
   * @param _userId - ID of the user (reserved for future authorization checks)
   * @param collectionId - ID of the collection to find similar collections for
   * @param limit - Maximum number of similar collections to return (will be clamped 1-100)
   * @returns Promise resolving to array of collection IDs, ordered by similarity (most similar first)
   */
  async findSimilarCollections(
    _userId: string,
    collectionId: string,
    limit: number
  ): Promise<string[]> {
    // Clamp limit defensively (even though controller validates)
    const clampedLimit = Math.min(Math.max(limit, 1), 100);

    const record = await this.embeddingRepo.findByCollectionId(collectionId);
    if (!record?.embedding) {
      return [];
    }

    const embedding = record.embedding;
    return this.embeddingRepo.findSimilarCollections(embedding, clampedLimit, [collectionId]);
  }
}
