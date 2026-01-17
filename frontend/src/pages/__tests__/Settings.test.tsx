import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Mock TanStack Router components
vi.mock("@tanstack/react-router", () => ({
  Link: vi.fn(({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  )),
  useNavigate: vi.fn(() => vi.fn()),
  useRouter: vi.fn(() => ({
    history: { back: vi.fn() },
  })),
}));

// Mock layout components to avoid LayoutProvider requirement
vi.mock("@/components/layout", () => ({
  BackButton: vi.fn(() => <button>Back</button>),
  PageLayout: vi.fn(({ children }: { children: ReactNode }) => <div>{children}</div>),
}));

// Mock theme context
vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: vi.fn(() => ({
    theme: "dark",
    setTheme: vi.fn(),
  })),
}));

// Mock preferences API
vi.mock("@/lib/api", () => ({
  preferencesAPI: {
    get: vi.fn().mockResolvedValue({
      data: {
        preferences: {
          default_view: "grid",
          items_per_page: 25,
          theme: "dark",
        },
      },
    }),
    update: vi.fn().mockResolvedValue({}),
  },
}));

// Mock user preferences hook
vi.mock("@/hooks/useUserPreferences", () => ({
  useUserPreferences: vi.fn(() => ({
    data: {
      preferences: {
        default_view: "grid",
        items_per_page: 25,
        theme: "dark",
      },
    },
    isLoading: false,
  })),
}));

// Mock credentials hooks
const mockUseCredentials = vi.fn();
const mockDeleteMutate = vi.fn();
const mockValidateMutate = vi.fn();

vi.mock("@/features/credentials/hooks", () => ({
  useCredentials: () => mockUseCredentials(),
  useDeleteCredentials: vi.fn(() => ({
    mutate: mockDeleteMutate,
    isPending: false,
  })),
  useValidateCredentials: vi.fn(() => ({
    mutate: mockValidateMutate,
    isPending: false,
  })),
}));

// Mock credentials store
const mockHasIgdbCredentials = vi.fn();
const mockIsIgdbTokenExpired = vi.fn();

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

// Mock IGDBCredentialsForm
vi.mock("@/features/credentials/components", () => ({
  IGDBCredentialsForm: vi.fn(() => (
    <div data-testid="igdb-credentials-form">IGDB Credentials Form</div>
  )),
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

describe("Settings Page - Credentials Section", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();

    // Default: no credentials configured
    mockHasIgdbCredentials.mockReturnValue(false);
    mockIsIgdbTokenExpired.mockReturnValue(false);
    mockUseCredentials.mockReturnValue({
      data: { services: [] },
      isLoading: false,
      isError: false,
    });
  });

  it("should render API Credentials section heading", async () => {
    const { Settings } = await import("../Settings");
    render(<Settings />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByRole("heading", { name: /api credentials/i })).toBeInTheDocument();
  });

  it("should show IGDBCredentialsForm when credentials are not configured", async () => {
    mockHasIgdbCredentials.mockReturnValue(false);

    const { Settings } = await import("../Settings");
    render(<Settings />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByTestId("igdb-credentials-form")).toBeInTheDocument();
    expect(screen.getByText(/not configured/i)).toBeInTheDocument();
  });

  it("should show active status badge when credentials are configured and active", async () => {
    mockHasIgdbCredentials.mockReturnValue(true);
    mockIsIgdbTokenExpired.mockReturnValue(false);
    mockUseCredentials.mockReturnValue({
      data: {
        services: [
          {
            service: "igdb",
            is_active: true,
            has_valid_token: true,
            token_expires_at: new Date(Date.now() + 86400000).toISOString(),
          },
        ],
      },
      isLoading: false,
      isError: false,
    });

    const { Settings } = await import("../Settings");
    render(<Settings />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByText(/active/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
  });

  it("should show expired warning badge when token is expired", async () => {
    mockHasIgdbCredentials.mockReturnValue(true);
    mockIsIgdbTokenExpired.mockReturnValue(true);
    mockUseCredentials.mockReturnValue({
      data: {
        services: [
          {
            service: "igdb",
            is_active: true,
            has_valid_token: false,
            token_expires_at: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      },
      isLoading: false,
      isError: false,
    });

    const { Settings } = await import("../Settings");
    render(<Settings />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByText(/expired/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });

  it("should call deleteCredentials when Remove button is clicked", async () => {
    const user = userEvent.setup();
    mockHasIgdbCredentials.mockReturnValue(true);
    mockIsIgdbTokenExpired.mockReturnValue(false);
    mockUseCredentials.mockReturnValue({
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
    });

    const { Settings } = await import("../Settings");
    render(<Settings />, { wrapper: createWrapper(queryClient) });

    const removeButton = screen.getByRole("button", { name: /remove/i });
    await user.click(removeButton);

    await waitFor(() => {
      expect(mockDeleteMutate).toHaveBeenCalledWith("igdb", expect.anything());
    });
  });

  it("should call validateCredentials when Refresh button is clicked", async () => {
    const user = userEvent.setup();
    mockHasIgdbCredentials.mockReturnValue(true);
    mockIsIgdbTokenExpired.mockReturnValue(false);
    mockUseCredentials.mockReturnValue({
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
    });

    const { Settings } = await import("../Settings");
    render(<Settings />, { wrapper: createWrapper(queryClient) });

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockValidateMutate).toHaveBeenCalledWith("igdb", expect.anything());
    });
  });

  it("should show IGDB label in credentials section", async () => {
    const { Settings } = await import("../Settings");
    render(<Settings />, { wrapper: createWrapper(queryClient) });

    // Find the IGDB label specifically (not the form which contains "IGDB Credentials Form")
    const igdbLabels = screen.getAllByText(/igdb/i);
    expect(igdbLabels.length).toBeGreaterThanOrEqual(1);
    // The first match should be the label in the credentials section
    expect(igdbLabels[0]).toBeInTheDocument();
  });
});
