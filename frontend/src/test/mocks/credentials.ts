import { vi } from "vitest"

/**
 * Mock configuration for useSaveCredentials hook
 */
export interface MockSaveCredentialsConfig {
  mutate?: ReturnType<typeof vi.fn>
  isPending?: boolean
  isSuccess?: boolean
  isError?: boolean
  error?: Error | null
}

/**
 * Default mock state for useSaveCredentials
 */
export const defaultMockSaveCredentials: Required<MockSaveCredentialsConfig> = {
  mutate: vi.fn(),
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
}

/**
 * Creates a mock implementation for useSaveCredentials that can be customized.
 * Use this helper to create consistent mocks across credential-related tests.
 *
 * @param config - Optional configuration to override default mock values
 * @returns Mock implementation object matching useSaveCredentials return type
 */
export function createMockSaveCredentials(
  config: MockSaveCredentialsConfig = {}
): Required<MockSaveCredentialsConfig> {
  return {
    ...defaultMockSaveCredentials,
    mutate: config.mutate ?? vi.fn(),
    ...config,
  }
}

/**
 * Sets up the vi.mock for useSaveCredentials with the provided configuration.
 * This should be called with vi.mock at the top of test files.
 *
 * @example
 * ```typescript
 * import { vi } from "vitest"
 * import { createMockSaveCredentials } from "@/test/mocks/credentials"
 *
 * const mockMutate = vi.fn()
 * vi.mock("@/features/credentials/hooks/useCredentials", () => ({
 *   useSaveCredentials: vi.fn(() => createMockSaveCredentials({ mutate: mockMutate })),
 * }))
 * ```
 */
export function setupUseSaveCredentialsMock(
  config: MockSaveCredentialsConfig = {}
): { useSaveCredentials: ReturnType<typeof vi.fn> } {
  return {
    useSaveCredentials: vi.fn(() => createMockSaveCredentials(config)),
  }
}
