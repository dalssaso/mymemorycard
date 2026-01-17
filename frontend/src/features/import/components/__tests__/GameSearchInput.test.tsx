import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { GameSearchInput } from "../GameSearchInput";

vi.mock("@/features/library/hooks/useSearchGames", () => ({
  useSearchGames: vi.fn(() => ({
    results: [],
    isLoading: false,
    isError: false,
    cancelSearch: vi.fn(),
  })),
}));

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }): ReactNode {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe("GameSearchInput", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
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
});
