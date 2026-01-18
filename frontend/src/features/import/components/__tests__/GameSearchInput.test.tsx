import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { GameSearchInput } from "../GameSearchInput";
import type { GameSearchResult } from "@/shared/api/services";

let mockResults: GameSearchResult[] = [];
let mockIsLoading = false;
let mockIsError = false;

vi.mock("@/features/library/hooks/useSearchGames", () => ({
  useSearchGames: vi.fn(() => ({
    results: mockResults,
    isLoading: mockIsLoading,
    isError: mockIsError,
    cancelSearch: vi.fn(),
  })),
}));

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const createWrapper = (
  queryClient: QueryClient
): (({ children }: { children: ReactNode }) => JSX.Element) => {
  return function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe("GameSearchInput", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    mockResults = [];
    mockIsLoading = false;
    mockIsError = false;
  });

  it("should render search input", () => {
    const onSelect = vi.fn();
    render(<GameSearchInput onSelect={onSelect} />, {
      wrapper: createWrapper(queryClient),
    });

    expect(screen.getByPlaceholderText(/search games/i)).toBeInTheDocument();
  });

  it("should update input value when typing", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<GameSearchInput onSelect={onSelect} />, {
      wrapper: createWrapper(queryClient),
    });

    const input = screen.getByPlaceholderText(/search games/i);
    await user.type(input, "zelda");

    expect(input).toHaveValue("zelda");
  });

  it("should show loading indicator when isLoading is true", async () => {
    mockIsLoading = true;
    const onSelect = vi.fn();
    render(<GameSearchInput onSelect={onSelect} />, {
      wrapper: createWrapper(queryClient),
    });

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("should show error message when isError is true", async () => {
    mockIsError = true;
    const onSelect = vi.fn();
    render(<GameSearchInput onSelect={onSelect} />, {
      wrapper: createWrapper(queryClient),
    });

    expect(screen.getByText(/failed to search/i)).toBeInTheDocument();
  });

  it("should show results dropdown when results are returned", async () => {
    const user = userEvent.setup();
    mockResults = [
      {
        igdb_id: 1234,
        name: "The Legend of Zelda",
        cover_art_url: "https://example.com/zelda.jpg",
        release_date: "1986-02-21",
        platforms: [{ igdb_platform_id: 1, name: "NES" }],
        stores: [],
      },
      {
        igdb_id: 5678,
        name: "Zelda II",
        cover_art_url: null,
        release_date: "1987-01-14",
        platforms: [],
        stores: [],
      },
    ];

    const onSelect = vi.fn();
    render(<GameSearchInput onSelect={onSelect} />, {
      wrapper: createWrapper(queryClient),
    });

    const input = screen.getByPlaceholderText(/search games/i);
    await user.type(input, "zelda");

    expect(screen.getByText("The Legend of Zelda")).toBeInTheDocument();
    expect(screen.getByText("Zelda II")).toBeInTheDocument();
    expect(screen.getByText("NES")).toBeInTheDocument();
  });

  it("should call onSelect when clicking a result", async () => {
    const user = userEvent.setup();
    const mockGame = {
      igdb_id: 1234,
      name: "The Legend of Zelda",
      cover_art_url: "https://example.com/zelda.jpg",
      release_date: "1986-02-21",
      platforms: [],
      stores: [],
    };
    mockResults = [mockGame];

    const onSelect = vi.fn();
    render(<GameSearchInput onSelect={onSelect} />, {
      wrapper: createWrapper(queryClient),
    });

    const input = screen.getByPlaceholderText(/search games/i);
    await user.type(input, "zelda");

    const resultButton = screen.getByText("The Legend of Zelda");
    await user.click(resultButton);

    expect(onSelect).toHaveBeenCalledWith(mockGame);
  });

  it("should show no results message when query has no matches", async () => {
    const user = userEvent.setup();
    mockResults = [];
    mockIsLoading = false;

    const onSelect = vi.fn();
    render(<GameSearchInput onSelect={onSelect} />, {
      wrapper: createWrapper(queryClient),
    });

    const input = screen.getByPlaceholderText(/search games/i);
    await user.type(input, "xyznonexistent");

    await waitFor(() => {
      expect(screen.getByText(/no games found/i)).toBeInTheDocument();
    });
  });

  it("should clear input and close dropdown after selecting a game", async () => {
    const user = userEvent.setup();
    mockResults = [
      {
        igdb_id: 1234,
        name: "The Legend of Zelda",
        cover_art_url: null,
        release_date: null,
        platforms: [],
        stores: [],
      },
    ];

    const onSelect = vi.fn();
    render(<GameSearchInput onSelect={onSelect} />, {
      wrapper: createWrapper(queryClient),
    });

    const input = screen.getByPlaceholderText(/search games/i) as HTMLInputElement;
    await user.type(input, "zelda");

    const resultButton = screen.getByText("The Legend of Zelda");
    await user.click(resultButton);

    expect(input.value).toBe("");
  });
});
