import type { CollectionSuggestion, NextGameSuggestion } from "../types";

/**
 * Defines AI curation capabilities for user game libraries.
 */
export interface ICuratorService {
  /**
   * Suggests game collections from a user's library.
   *
   * @param userId - User ID requesting suggestions
   * @param gameIds - Game IDs from the user's library
   * @returns Promise resolving to collection suggestions
   */
  suggestCollections(userId: string, gameIds: string[]): Promise<CollectionSuggestion[]>;
  /**
   * Suggests the next game to play based on recent activity.
   *
   * @param userId - User ID requesting suggestions
   * @param recentGameIds - Recently played game IDs
   * @returns Promise resolving to next game suggestions
   */
  suggestNextGame(userId: string, recentGameIds: string[]): Promise<NextGameSuggestion[]>;
}
