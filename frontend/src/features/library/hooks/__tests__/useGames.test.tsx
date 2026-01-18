import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { mockGame, mockGamesListResponse } from "@/test/mocks/games";
import { useGames, useGame, useUpdateGame, useDeleteGame, useCreateGame } from "../useGames";
import { useSearchGames } from "../useSearchGames";

const mockList = vi.fn();
const mockGetOne = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockCreate = vi.fn();
const mockSearch = vi.fn();

vi.mock("@/shared/api/services", () => ({
  GamesService: {
    list: (...args: unknown[]) => mockList(...args),
    getOne: (...args: unknown[]) => mockGetOne(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    search: (...args: unknown[]) => mockSearch(...args),
  },
}));

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const createWrapper = (
  queryClient: QueryClient
): (({ children }: { children: ReactNode }) => JSX.Element) => {
  return function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe("useGames", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    mockList.mockResolvedValue(mockGamesListResponse);
    mockGetOne.mockResolvedValue(mockGame);
    mockUpdate.mockResolvedValue({ ...mockGame, status: "completed" });
    mockDelete.mockResolvedValue(undefined);
    mockCreate.mockResolvedValue({
      id: "game-new",
      igdb_id: 99999,
      name: "Imported Game",
      status: null,
    });
    mockSearch.mockResolvedValue({
      games: [{ igdb_id: 123, name: "Search Result" }],
    });
  });

  it("should fetch games list", async () => {
    const { result } = renderHook(() => useGames({}), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.games).toHaveLength(1);
    expect(result.current.data?.games[0].name).toBe("Test Game");
  });

  it("should include filters in query key", async () => {
    const filters = { status: "playing" };
    const { result } = renderHook(() => useGames(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current).toBeDefined();
    expect(mockList).toHaveBeenCalledWith(filters);
  });
});

describe("useGame", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    mockGetOne.mockResolvedValue(mockGame);
  });

  it("should fetch single game by ID", async () => {
    const { result } = renderHook(() => useGame("game-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.name).toBe("Test Game");
  });

  it("should not fetch when ID is empty", () => {
    const { result } = renderHook(() => useGame(""), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useUpdateGame", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({ ...mockGame, status: "completed" });
  });

  it("should return mutation function", () => {
    const { result } = renderHook(() => useUpdateGame(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
  });

  it("should call GamesService.update with correct args on mutation", async () => {
    const { result } = renderHook(() => useUpdateGame(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ id: "game-1", payload: { owned: true } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalledWith("game-1", { owned: true });
  });
});

describe("useDeleteGame", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    mockDelete.mockResolvedValue(undefined);
  });

  it("should return mutation function", () => {
    const { result } = renderHook(() => useDeleteGame(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
  });

  it("should call GamesService.delete with game id on mutation", async () => {
    const { result } = renderHook(() => useDeleteGame(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate("game-1");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDelete).toHaveBeenCalledWith("game-1");
  });

  it("should handle delete error", async () => {
    mockDelete.mockRejectedValueOnce(new Error("Delete failed"));

    const { result } = renderHook(() => useDeleteGame(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate("game-1");

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe("useCreateGame", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({
      id: "game-new",
      igdb_id: 99999,
      name: "Imported Game",
      status: null,
    });
  });

  it("should return mutation function", () => {
    const { result } = renderHook(() => useCreateGame(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
  });

  it("should call GamesService.create on mutation", async () => {
    const { result } = renderHook(() => useCreateGame(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      igdb_id: 99999,
      platform_id: "platform-1",
      store_id: "store-1",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCreate).toHaveBeenCalledWith({
      igdb_id: 99999,
      platform_id: "platform-1",
      store_id: "store-1",
    });
  });
});

describe("useSearchGames", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it("should not search when query is empty", () => {
    const { result } = renderHook(() => useSearchGames(""), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("should have cancelSearch function", () => {
    const { result } = renderHook(() => useSearchGames("zelda"), {
      wrapper: createWrapper(queryClient),
    });

    expect(typeof result.current.cancelSearch).toBe("function");
  });

  it("should search after debounce delay elapses", async () => {
    vi.useFakeTimers();

    try {
      const mockSearchResults = {
        games: [
          { igdb_id: 1234, name: "The Legend of Zelda", cover_art_url: null },
          { igdb_id: 5678, name: "Zelda II", cover_art_url: null },
        ],
      };
      mockSearch.mockResolvedValue(mockSearchResults);

      const { result } = renderHook(() => useSearchGames("zelda", 50), {
        wrapper: createWrapper(queryClient),
      });

      // Advance timers to trigger debounce and flush pending promises
      await act(async () => {
        await vi.advanceTimersByTimeAsync(50);
      });

      // Wait for search to complete (React Query async)
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Restore real timers before waitFor (which needs real timers to work)
      vi.useRealTimers();

      await waitFor(() => {
        expect(result.current.results).toHaveLength(2);
      });

      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ query: "zelda" }));
      expect(result.current.results[0].name).toBe("The Legend of Zelda");
    } finally {
      vi.useRealTimers();
    }
  });
});
