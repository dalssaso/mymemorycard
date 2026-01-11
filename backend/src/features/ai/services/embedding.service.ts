import { injectable, inject } from "tsyringe"

import type { IEmbeddingService } from "./embedding.service.interface"
import type { IGatewayService } from "./gateway.service.interface"
import type { IEmbeddingRepository } from "../repositories/embedding.repository.interface"
import type { IAiSettingsRepository } from "../repositories/ai-settings.repository.interface"
import { NotFoundError } from "@/shared/errors/base"

@injectable()
export class EmbeddingService implements IEmbeddingService {
  constructor(
    @inject("IGatewayService") private gateway: IGatewayService,
    @inject("IEmbeddingRepository") private embeddingRepo: IEmbeddingRepository,
    @inject("IAiSettingsRepository") private settingsRepo: IAiSettingsRepository
  ) {}

  async generateGameEmbedding(
    userId: string,
    gameId: string,
    gameText: string
  ): Promise<void> {
    const config = await this.settingsRepo.getGatewayConfig(userId)
    if (!config) {
      throw new NotFoundError("AI settings not configured")
    }

    const result = await this.gateway.generateEmbedding(gameText, config)
    await this.embeddingRepo.saveGameEmbedding(gameId, result.embedding, result.model)
  }

  async generateCollectionEmbedding(
    userId: string,
    collectionId: string,
    collectionText: string
  ): Promise<void> {
    const config = await this.settingsRepo.getGatewayConfig(userId)
    if (!config) {
      throw new NotFoundError("AI settings not configured")
    }

    const result = await this.gateway.generateEmbedding(collectionText, config)
    await this.embeddingRepo.saveCollectionEmbedding(
      collectionId,
      result.embedding,
      result.model
    )
  }

  async findSimilarGames(_userId: string, gameId: string, limit: number): Promise<string[]> {
    const record = await this.embeddingRepo.findByGameId(gameId)
    if (!record?.embedding) {
      return []
    }

    const embedding = record.embedding
    return this.embeddingRepo.findSimilarGames(embedding, limit, [gameId])
  }

  async findSimilarCollections(
    _userId: string,
    collectionId: string,
    limit: number
  ): Promise<string[]> {
    const record = await this.embeddingRepo.findByCollectionId(collectionId)
    if (!record?.embedding) {
      return []
    }

    const embedding = record.embedding
    return this.embeddingRepo.findSimilarCollections(embedding, limit)
  }
}
