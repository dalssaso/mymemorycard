import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Mock TanStack Router components
vi.mock("@tanstack/react-router", () => ({
  Link: vi.fn(({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  )),
  useNavigate: vi.fn(() => vi.fn()),
}));

// Mock credentials hooks
const mockHasIgdbCredentials = vi.fn(() => true);
const mockIsIgdbTokenExpired = vi.fn(() => false);

vi.mock("@/shared/stores/credentialsStore", () => ({
  useCredentialsStore: vi.fn((selector) => {
    const state = {
      credentials: [],
      hasIgdbCredentials: mockHasIgdbCredentials,
      isIgdbTokenExpired: mockIsIgdbTokenExpired,
    };
    return selector(state);
  }),
}));

vi.mock("@/features/credentials/hooks/useCredentials", () => ({
  useCredentials: vi.fn(() => ({
    data: {
      services: [
        {
          service: "igdb",
          is_active: true,
          has_valid_token: true,
        },
      ],
    },
    isLoading: false,
    isError: false,
  })),
}));

vi.mock("@/features/library/hooks/useSearchGames", () => ({
  useSearchGames: vi.fn(() => ({
    results: [],
    isLoading: false,
    isError: false,
    cancelSearch: vi.fn(),
  })),
}));

const mockMutate = vi.fn();
const mockUseCreateGame = vi.fn(() => ({
  mutate: mockMutate,
  isPending: false,
  isError: false,
}));

vi.mock("@/features/library/hooks/useGames", () => ({
  useCreateGame: () => mockUseCreateGame(),
}));

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

// Simple wrapper that provides QueryClient only
const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: ReactNode }): ReactNode {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe("ImportIGDB Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    mockHasIgdbCredentials.mockReturnValue(true);
    mockIsIgdbTokenExpired.mockReturnValue(false);
    mockUseCreateGame.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
    });
  });

  it("should show IGDB credentials required message when not configured", async () => {
    mockHasIgdbCredentials.mockReturnValue(false);

    const { ImportIGDB } = await import("../ImportIGDB");
    render(<ImportIGDB />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByText(/igdb credentials required/i)).toBeInTheDocument();
    expect(screen.getByText(/go to settings/i)).toBeInTheDocument();
  });

  it("should show search input when credentials are configured", async () => {
    const { ImportIGDB } = await import("../ImportIGDB");
    render(<ImportIGDB />, { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search games/i)).toBeInTheDocument();
    });
  });

  it("should show page title and description", async () => {
    const { ImportIGDB } = await import("../ImportIGDB");
    render(<ImportIGDB />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByRole("heading", { name: /import games/i })).toBeInTheDocument();
    expect(screen.getByText(/search igdb to find and import games/i)).toBeInTheDocument();
  });

  it("should show expired token message when token is expired", async () => {
    mockHasIgdbCredentials.mockReturnValue(false);
    mockIsIgdbTokenExpired.mockReturnValue(true);

    const { ImportIGDB } = await import("../ImportIGDB");
    render(<ImportIGDB />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByText(/your igdb token has expired/i)).toBeInTheDocument();
  });

  it("should show search IGDB section heading", async () => {
    const { ImportIGDB } = await import("../ImportIGDB");
    render(<ImportIGDB />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByRole("heading", { name: /search igdb/i })).toBeInTheDocument();
  });

  it("should have GameSearchInput component available", async () => {
    const { ImportIGDB } = await import("../ImportIGDB");
    render(<ImportIGDB />, { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search games/i)).toBeInTheDocument();
    });
  });
});
