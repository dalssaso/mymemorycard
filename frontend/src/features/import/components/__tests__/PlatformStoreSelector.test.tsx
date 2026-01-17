import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { PlatformStoreSelector } from "../PlatformStoreSelector";

const mockPlatformsResponse = {
  platforms: [
    {
      id: "platform-1",
      igdb_platform_id: 6,
      name: "PC (Windows)",
      platform_family: "PC",
    },
    {
      id: "platform-2",
      igdb_platform_id: 48,
      name: "PlayStation 4",
      platform_family: "PlayStation",
    },
  ],
};

const mockStoresResponse = {
  stores: [
    {
      id: "store-1",
      slug: "steam",
      name: "Steam",
      display_name: "Steam",
      platform_family: "PC",
    },
    {
      id: "store-2",
      slug: "playstation_store",
      name: "PlayStation Store",
      display_name: "PlayStation Store",
      platform_family: "PlayStation",
    },
  ],
};

const mockPlatformsList = vi.fn().mockResolvedValue(mockPlatformsResponse);
const mockStoresList = vi.fn().mockResolvedValue(mockStoresResponse);

vi.mock("@/shared/api/services", () => ({
  PlatformsService: {
    list: () => mockPlatformsList(),
  },
  StoresService: {
    list: () => mockStoresList(),
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

const defaultProps = {
  platforms: [
    { igdb_platform_id: 6, name: "PC (Windows)" },
    { igdb_platform_id: 48, name: "PlayStation 4" },
  ],
  suggestedStores: [
    { slug: "steam", display_name: "Steam" },
    { slug: "playstation_store", display_name: "PlayStation Store" },
  ],
  onSelect: vi.fn(),
};

describe("PlatformStoreSelector", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    mockPlatformsList.mockResolvedValue(mockPlatformsResponse);
    mockStoresList.mockResolvedValue(mockStoresResponse);
  });

  it("should render platform dropdown", async () => {
    render(<PlatformStoreSelector {...defaultProps} />, {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/platform/i)).toBeInTheDocument();
    });
  });

  it("should render store dropdown", async () => {
    render(<PlatformStoreSelector {...defaultProps} />, {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/store/i)).toBeInTheDocument();
    });
  });

  it("should have disabled import button when no selection", async () => {
    render(<PlatformStoreSelector {...defaultProps} />, {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /import/i })).toBeDisabled();
    });
  });

  it("should filter platforms by IGDB IDs", async () => {
    const user = userEvent.setup();
    render(
      <PlatformStoreSelector
        {...defaultProps}
        platforms={[{ igdb_platform_id: 6, name: "PC (Windows)" }]}
      />,
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/platform/i)).not.toBeDisabled();
    });

    const platformSelect = screen.getByRole("combobox", { name: /platform/i });
    await user.click(platformSelect);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /PC \(Windows\)/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole("option", { name: /PlayStation 4/i })).not.toBeInTheDocument();
  });

  it("should enable store dropdown after platform selection", async () => {
    const user = userEvent.setup();
    render(<PlatformStoreSelector {...defaultProps} />, {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/platform/i)).not.toBeDisabled();
    });

    const platformSelect = screen.getByRole("combobox", { name: /platform/i });
    await user.click(platformSelect);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /PC \(Windows\)/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("option", { name: /PC \(Windows\)/i }));

    const storeSelect = screen.getByRole("combobox", { name: /store/i });
    expect(storeSelect).not.toBeDisabled();
  });

  it("should call onSelect with correct IDs when import button clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PlatformStoreSelector {...defaultProps} onSelect={onSelect} />, {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/platform/i)).not.toBeDisabled();
    });

    const platformSelect = screen.getByRole("combobox", { name: /platform/i });
    await user.click(platformSelect);
    await user.click(screen.getByRole("option", { name: /PC \(Windows\)/i }));

    const storeSelect = screen.getByRole("combobox", { name: /store/i });
    await user.click(storeSelect);
    await user.click(screen.getByRole("option", { name: /Steam/i }));

    const importButton = screen.getByRole("button", { name: /import/i });
    expect(importButton).not.toBeDisabled();
    await user.click(importButton);

    expect(onSelect).toHaveBeenCalledWith("platform-1", "store-1");
  });

  it("should filter stores by platform family", async () => {
    const user = userEvent.setup();
    render(<PlatformStoreSelector {...defaultProps} />, {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/platform/i)).not.toBeDisabled();
    });

    const platformSelect = screen.getByRole("combobox", { name: /platform/i });
    await user.click(platformSelect);
    await user.click(screen.getByRole("option", { name: /PC \(Windows\)/i }));

    const storeSelect = screen.getByRole("combobox", { name: /store/i });
    await user.click(storeSelect);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /Steam/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole("option", { name: /PlayStation Store/i })).not.toBeInTheDocument();
  });

  it("should display error message when platforms query fails", async () => {
    mockPlatformsList.mockRejectedValue(new Error("Network error"));

    render(<PlatformStoreSelector {...defaultProps} />, {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(screen.getByText(/failed to load platforms/i)).toBeInTheDocument();
    });
  });

  it("should display error message when stores query fails", async () => {
    mockStoresList.mockRejectedValue(new Error("Network error"));

    render(<PlatformStoreSelector {...defaultProps} />, {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(screen.getByText(/failed to load stores/i)).toBeInTheDocument();
    });
  });

  it("should display message when no platforms available for game", async () => {
    render(
      <PlatformStoreSelector
        {...defaultProps}
        platforms={[{ igdb_platform_id: 999, name: "Unknown Platform" }]}
      />,
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(screen.getByText(/no platforms available for this game/i)).toBeInTheDocument();
    });
  });
});
