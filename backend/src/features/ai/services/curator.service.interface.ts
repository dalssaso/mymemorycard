import type { CollectionSuggestion, NextGameSuggestion } from "../types";

export interface ICuratorService {
  suggestCollections(userId: string, gameIds: string[]): Promise<CollectionSuggestion[]>;
  suggestNextGame(userId: string, recentGameIds: string[]): Promise<NextGameSuggestion[]>;
}
