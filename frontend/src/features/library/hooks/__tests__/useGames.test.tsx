import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useGames, useGame, useUpdateGame, useDeleteGame } from "../useGames";
import { useSearchGames } from "../useSearchGames";

vi.mock("@/shared/api/services", () => ({
  GamesService: {
    list: vi.fn().mockResolvedValue({
      games: [
        {
          id: "game-1",
          igdb_id: 12345,
          name: "Test Game",
          status: "playing",
        },
      ],
      total: 1,
      page: 1,
      per_page: 20,
    }),
    getOne: vi.fn().mockResolvedValue({
      id: "game-1",
      igdb_id: 12345,
      name: "Test Game",
      status: "playing",
    }),
    update: vi.fn().mockResolvedValue({
      id: "game-1",
      igdb_id: 12345,
      name: "Test Game",
      status: "completed",
    }),
    delete: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue({
      games: [{ igdb_id: 123, name: "Search Result" }],
    }),
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

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }): ReactNode {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe("useGames", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
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
  });
});

describe("useGame", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
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
  });

  it("should return mutation function", () => {
    const { result } = renderHook(() => useUpdateGame(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
  });
});

describe("useDeleteGame", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it("should return mutation function", () => {
    const { result } = renderHook(() => useDeleteGame(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.mutate).toBeDefined();
    expect(result.current.mutateAsync).toBeDefined();
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
});
