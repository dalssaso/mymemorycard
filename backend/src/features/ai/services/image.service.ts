import { injectable, inject } from "tsyringe";
import type { IImageService } from "./image.service.interface";
import type { IGatewayService } from "./gateway.service.interface";
import type { IAiSettingsRepository } from "../repositories/ai-settings.repository.interface";
import type { ImageResult } from "../types";
import { NotFoundError } from "@/shared/errors/base";

@injectable()
export class ImageService implements IImageService {
  constructor(
    @inject("IGatewayService") private gateway: IGatewayService,
    @inject("IAiSettingsRepository") private settingsRepo: IAiSettingsRepository
  ) {}

  /**
   * Generates a collection cover image using xAI.
   *
   * Creates a stylized video game collection cover art based on the collection name
   * and associated games. Uses xAI's image generation capabilities via the gateway.
   * Limits game names to first 5 for optimal prompt length.
   *
   * @param userId - ID of the user who owns the AI settings
   * @param collectionName - Name of the collection to generate cover for
   * @param gameNames - Array of game names in the collection (uses first 5)
   * @returns Promise resolving to image result with URL and model
   * @throws {NotFoundError} If AI settings are not configured for the user
   */
  async generateCollectionCover(
    userId: string,
    collectionName: string,
    gameNames: string[]
  ): Promise<ImageResult> {
    const config = await this.settingsRepo.getGatewayConfig(userId);
    if (!config) {
      throw new NotFoundError("AI settings not configured");
    }

    // Force xAI for image generation
    const xaiConfig = { ...config, provider: "xai" as const };

    const gamesText =
      gameNames.length === 0 ? "various popular titles" : gameNames.slice(0, 5).join(", ");

    const prompt = `Create a stylized video game collection cover art for a collection named "${collectionName}" featuring games like: ${gamesText}. Style: modern, minimalist, gaming aesthetic.`;

    const result = await this.gateway.generateImage(prompt, xaiConfig);

    return result;
  }
}
