import { injectable, inject } from "tsyringe";
import { z } from "zod";
import type { ICuratorService } from "./curator.service.interface";
import type { IGatewayService } from "./gateway.service.interface";
import type { IAiSettingsRepository } from "../repositories/ai-settings.repository.interface";
import type { CollectionSuggestion, NextGameSuggestion } from "../types";
import { ConfigurationError } from "../errors/configuration.error";
import { Logger } from "@/infrastructure/logging/logger";

const COLLECTION_SUGGESTION_PROMPT = `You are a video game curator. Analyze the user's game library and suggest meaningful collections.
Return JSON array of suggestions with: name, description, gameIds (array of game IDs), confidence (0-1).
Focus on themes, genres, gameplay styles, or series.`;

const NEXT_GAME_PROMPT = `You are a video game recommender. Based on the user's recently played games, suggest what they should play next from their library.
Return JSON array of suggestions with: gameId, reason (brief explanation), confidence (0-1).
Consider gameplay variety, mood, and completion patterns.`;

const CollectionSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
  gameIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

const NextGameSuggestionSchema = z.object({
  gameId: z.string(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
});

@injectable()
export class CuratorService implements ICuratorService {
  constructor(
    @inject("IGatewayService") private gateway: IGatewayService,
    @inject("IAiSettingsRepository") private settingsRepo: IAiSettingsRepository,
    @inject(Logger) private logger: Logger
  ) {}

  /**
   * Suggests game collections based on the user's library
   *
   * @param userId - The user ID to generate suggestions for
   * @param gameIds - Array of game IDs in the user's library
   * @returns Array of collection suggestions with name, description, game IDs, and confidence
   * @throws {ConfigurationError} If AI settings are not configured for the user
   *
   * Returns empty array if:
   * - gameIds is empty
   * - AI response parsing fails
   * - AI response validation fails
   */
  async suggestCollections(userId: string, gameIds: string[]): Promise<CollectionSuggestion[]> {
    if (!gameIds || gameIds.length === 0) {
      return [];
    }

    const config = await this.settingsRepo.getGatewayConfig(userId);
    if (!config) {
      throw new ConfigurationError("AI settings not configured");
    }

    const prompt = `Games in library: ${gameIds.join(", ")}`;

    const result = await this.gateway.generateCompletion(
      prompt,
      COLLECTION_SUGGESTION_PROMPT,
      config
    );

    try {
      const parsed = JSON.parse(result.text);
      const validation = z.array(CollectionSuggestionSchema).safeParse(parsed);

      if (!validation.success) {
        this.logger.error("Failed to validate collection suggestions from AI response", {
          userId,
          error: validation.error.message,
          responseText: this.truncateText(result.text),
        });
        return [];
      }

      return validation.data;
    } catch (error) {
      this.logger.error("Failed to parse collection suggestions", {
        userId,
        gameIds,
        responseText: this.truncateText(result.text),
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  private truncateText(text: string, maxLength = 200): string {
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength)}...`;
  }

  /**
   * Suggests the next game to play based on recently played games
   *
   * @param userId - The user ID to generate suggestions for
   * @param recentGameIds - Array of recently played game IDs
   * @returns Array of next game suggestions with game ID, reason, and confidence
   * @throws {ConfigurationError} If AI settings are not configured for the user
   *
   * Returns empty array if:
   * - recentGameIds is empty
   * - AI response parsing fails
   * - AI response validation fails
   */
  async suggestNextGame(userId: string, recentGameIds: string[]): Promise<NextGameSuggestion[]> {
    if (!recentGameIds || recentGameIds.length === 0) {
      return [];
    }

    const config = await this.settingsRepo.getGatewayConfig(userId);
    if (!config) {
      throw new ConfigurationError("AI settings not configured");
    }

    const prompt = `Recently played games: ${recentGameIds.join(", ")}`;

    const result = await this.gateway.generateCompletion(prompt, NEXT_GAME_PROMPT, config);

    try {
      const parsed = JSON.parse(result.text);
      const validation = z.array(NextGameSuggestionSchema).safeParse(parsed);

      if (!validation.success) {
        this.logger.error("Failed to validate next game suggestions from AI response", {
          userId,
          error: validation.error.message,
          responseText: this.truncateText(result.text),
        });
        return [];
      }

      return validation.data;
    } catch (error) {
      this.logger.error("Failed to parse next game suggestions", {
        userId,
        recentGameIds,
        prompt: NEXT_GAME_PROMPT,
        responseText: this.truncateText(result.text),
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
}
