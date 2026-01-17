import { vi } from "vitest";

/**
 * Mock game data for testing
 */
export const mockGame = {
  id: "game-1",
  igdb_id: 12345,
  name: "Test Game",
  status: "playing",
};

/**
 * Mock game list response for testing
 */
export const mockGamesListResponse = {
  games: [mockGame],
  total: 1,
  page: 1,
  per_page: 20,
};

/**
 * Mock search result for testing
 */
export const mockSearchResult = {
  games: [{ igdb_id: 123, name: "Search Result" }],
};

/**
 * Creates a mock GamesService for testing.
 * Use this helper to create consistent mocks across game-related tests.
 */
export function createMockGamesService(): {
  list: ReturnType<typeof vi.fn>;
  getOne: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  search: ReturnType<typeof vi.fn>;
} {
  return {
    list: vi.fn().mockResolvedValue(mockGamesListResponse),
    getOne: vi.fn().mockResolvedValue(mockGame),
    update: vi.fn().mockResolvedValue({
      ...mockGame,
      status: "completed",
    }),
    delete: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue({
      id: "game-new",
      igdb_id: 99999,
      name: "Imported Game",
      status: null,
    }),
    search: vi.fn().mockResolvedValue(mockSearchResult),
  };
}
