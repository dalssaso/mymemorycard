import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { IGDBCredentialsForm } from "../IGDBCredentialsForm";

vi.mock("@/features/credentials/hooks/useCredentials", () => ({
  useSaveCredentials: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
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

describe("IGDBCredentialsForm", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it("should render form with client ID and secret inputs", () => {
    render(<IGDBCredentialsForm />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByLabelText(/client id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/client secret/i)).toBeInTheDocument();
  });

  it("should have disabled submit when fields are empty", () => {
    render(<IGDBCredentialsForm />, { wrapper: createWrapper(queryClient) });

    const submitButton = screen.getByRole("button", { name: /save/i });
    expect(submitButton).toBeDisabled();
  });

  it("should enable submit when both fields are filled", async () => {
    const user = userEvent.setup();
    render(<IGDBCredentialsForm />, { wrapper: createWrapper(queryClient) });

    const clientIdInput = screen.getByLabelText(/client id/i);
    const secretInput = screen.getByLabelText(/client secret/i);

    await user.type(clientIdInput, "test-client-id");
    await user.type(secretInput, "test-secret");

    const submitButton = screen.getByRole("button", { name: /save/i });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
