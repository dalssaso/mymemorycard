import "@testing-library/jest-dom/vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { IGDBCredentialsForm } from "../IGDBCredentialsForm"
import { createMockSaveCredentials } from "@/test/mocks/credentials"

const mockMutate = vi.fn()
let mockIsPending = false
let mockIsSuccess = false
let mockIsError = false

vi.mock("@/features/credentials/hooks/useCredentials", () => ({
  useSaveCredentials: vi.fn(() =>
    createMockSaveCredentials({
      mutate: mockMutate,
      isPending: mockIsPending,
      isSuccess: mockIsSuccess,
      isError: mockIsError,
    })
  ),
}))

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

const createWrapper = (queryClient: QueryClient): (({ children }: { children: ReactNode }) => JSX.Element) => {
  return function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe("IGDBCredentialsForm", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()
    mockIsPending = false
    mockIsSuccess = false
    mockIsError = false
  })

  it("should render form with client ID and secret inputs", () => {
    render(<IGDBCredentialsForm />, { wrapper: createWrapper(queryClient) })

    expect(screen.getByLabelText(/client id/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/client secret/i)).toBeInTheDocument()
  })

  it("should have disabled submit when fields are empty", () => {
    render(<IGDBCredentialsForm />, { wrapper: createWrapper(queryClient) })

    const submitButton = screen.getByRole("button", { name: /save/i })
    expect(submitButton).toBeDisabled()
  })

  it("should enable submit when both fields are filled", async () => {
    const user = userEvent.setup()
    render(<IGDBCredentialsForm />, { wrapper: createWrapper(queryClient) })

    const clientIdInput = screen.getByLabelText(/client id/i)
    const secretInput = screen.getByLabelText(/client secret/i)

    await user.type(clientIdInput, "test-client-id")
    await user.type(secretInput, "test-secret")

    const submitButton = screen.getByRole("button", { name: /save/i })

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
  })

  it("should call saveCredentials.mutate with correct payload on submit", async () => {
    const user = userEvent.setup()
    render(<IGDBCredentialsForm />, { wrapper: createWrapper(queryClient) })

    const clientIdInput = screen.getByLabelText(/client id/i)
    const secretInput = screen.getByLabelText(/client secret/i)

    await user.type(clientIdInput, "my-client-id")
    await user.type(secretInput, "my-client-secret")

    const submitButton = screen.getByRole("button", { name: /save/i })
    await user.click(submitButton)

    expect(mockMutate).toHaveBeenCalledWith(
      {
        service: "igdb",
        credential_type: "twitch_oauth",
        credentials: {
          client_id: "my-client-id",
          client_secret: "my-client-secret",
        },
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    )
  })

  it("should show Saving... text when mutation is pending", async () => {
    mockIsPending = true
    const user = userEvent.setup()
    render(<IGDBCredentialsForm />, { wrapper: createWrapper(queryClient) })

    const clientIdInput = screen.getByLabelText(/client id/i)
    const secretInput = screen.getByLabelText(/client secret/i)

    await user.type(clientIdInput, "test-client-id")
    await user.type(secretInput, "test-secret")

    const submitButton = screen.getByRole("button", { name: /saving/i })
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it("should show success message when credentials are saved successfully", async () => {
    const user = userEvent.setup()
    mockMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.()
    })

    render(<IGDBCredentialsForm />, { wrapper: createWrapper(queryClient) })

    const clientIdInput = screen.getByLabelText(/client id/i)
    const secretInput = screen.getByLabelText(/client secret/i)

    await user.type(clientIdInput, "test-client-id")
    await user.type(secretInput, "test-secret")

    const submitButton = screen.getByRole("button", { name: /save/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/credentials saved successfully/i)).toBeInTheDocument()
    })
  })

  it("should show error message when credentials fail to save", async () => {
    const user = userEvent.setup()
    mockMutate.mockImplementation((_payload, options) => {
      options?.onError?.(new Error("Failed"))
    })

    render(<IGDBCredentialsForm />, { wrapper: createWrapper(queryClient) })

    const clientIdInput = screen.getByLabelText(/client id/i)
    const secretInput = screen.getByLabelText(/client secret/i)

    await user.type(clientIdInput, "test-client-id")
    await user.type(secretInput, "test-secret")

    const submitButton = screen.getByRole("button", { name: /save/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/failed to/i)).toBeInTheDocument()
    })
  })

  it("should clear form fields on successful save", async () => {
    const user = userEvent.setup()
    mockMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.()
    })

    render(<IGDBCredentialsForm />, { wrapper: createWrapper(queryClient) })

    const clientIdInput = screen.getByLabelText(/client id/i) as HTMLInputElement
    const secretInput = screen.getByLabelText(/client secret/i) as HTMLInputElement

    await user.type(clientIdInput, "test-client-id")
    await user.type(secretInput, "test-secret")

    const submitButton = screen.getByRole("button", { name: /save/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(clientIdInput.value).toBe("")
      expect(secretInput.value).toBe("")
    })
  })
})
