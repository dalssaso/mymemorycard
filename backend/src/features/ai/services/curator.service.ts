import { injectable, inject } from "tsyringe";
import type { ICuratorService } from "./curator.service.interface";
import type { IGatewayService } from "./gateway.service.interface";
import type { IAiSettingsRepository } from "../repositories/ai-settings.repository.interface";
import type { CollectionSuggestion, NextGameSuggestion } from "../types";
import { ConfigurationError } from "../errors/configuration.error";

const COLLECTION_SUGGESTION_PROMPT = `You are a video game curator. Analyze the user's game library and suggest meaningful collections.
Return JSON array of suggestions with: name, description, gameIds (array of game IDs), confidence (0-1).
Focus on themes, genres, gameplay styles, or series.`;

const NEXT_GAME_PROMPT = `You are a video game recommender. Based on the user's recently played games, suggest what they should play next from their library.
Return JSON array of suggestions with: gameId, reason (brief explanation), confidence (0-1).
Consider gameplay variety, mood, and completion patterns.`;

@injectable()
export class CuratorService implements ICuratorService {
  constructor(
    @inject("IGatewayService") private gateway: IGatewayService,
    @inject("IAiSettingsRepository") private settingsRepo: IAiSettingsRepository
  ) {}

  async suggestCollections(userId: string, gameIds: string[]): Promise<CollectionSuggestion[]> {
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
      const suggestions = JSON.parse(result.text) as CollectionSuggestion[];
      return suggestions;
    } catch {
      return [];
    }
  }

  async suggestNextGame(userId: string, recentGameIds: string[]): Promise<NextGameSuggestion[]> {
    const config = await this.settingsRepo.getGatewayConfig(userId);
    if (!config) {
      throw new ConfigurationError("AI settings not configured");
    }

    const prompt = `Recently played games: ${recentGameIds.join(", ")}`;

    const result = await this.gateway.generateCompletion(prompt, NEXT_GAME_PROMPT, config);

    try {
      const suggestions = JSON.parse(result.text) as NextGameSuggestion[];
      return suggestions;
    } catch {
      return [];
    }
  }
}
