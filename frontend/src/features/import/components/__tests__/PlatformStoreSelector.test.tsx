import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { PlatformStoreSelector } from "../PlatformStoreSelector";

vi.mock("@/shared/api/services", () => ({
  PlatformsService: {
    list: vi.fn().mockResolvedValue({
      platforms: [
        {
          id: "platform-1",
          igdb_platform_id: 6,
          name: "PC (Windows)",
          platform_family: "PC",
        },
      ],
    }),
  },
  StoresService: {
    list: vi.fn().mockResolvedValue({
      stores: [
        {
          id: "store-1",
          name: "steam",
          display_name: "Steam",
          platform_family: "PC",
        },
      ],
    }),
  },
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

describe("PlatformStoreSelector", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it("should render platform dropdown", async () => {
    const onSelect = vi.fn();
    render(
      <PlatformStoreSelector
        igdbId={12345}
        platforms={[{ igdb_platform_id: 6, name: "PC (Windows)" }]}
        suggestedStores={[{ slug: "steam", display_name: "Steam" }]}
        onSelect={onSelect}
      />,
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/platform/i)).toBeInTheDocument();
    });
  });

  it("should render store dropdown", async () => {
    const onSelect = vi.fn();
    render(
      <PlatformStoreSelector
        igdbId={12345}
        platforms={[{ igdb_platform_id: 6, name: "PC (Windows)" }]}
        suggestedStores={[{ slug: "steam", display_name: "Steam" }]}
        onSelect={onSelect}
      />,
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/store/i)).toBeInTheDocument();
    });
  });

  it("should have disabled import button when no selection", async () => {
    const onSelect = vi.fn();
    render(
      <PlatformStoreSelector
        igdbId={12345}
        platforms={[{ igdb_platform_id: 6, name: "PC (Windows)" }]}
        suggestedStores={[{ slug: "steam", display_name: "Steam" }]}
        onSelect={onSelect}
      />,
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /import/i })).toBeDisabled();
    });
  });
});
