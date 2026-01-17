import { vi } from "vitest";

/**
 * Mock functions for the generated API SDK.
 * Use these to set up vi.mock for @/shared/api/generated.
 */
export const mockGetApiV1Credentials = vi.fn();
export const mockPostApiV1Credentials = vi.fn();
export const mockPostApiV1CredentialsValidate = vi.fn();
export const mockDeleteApiV1CredentialsByService = vi.fn();

/**
 * Creates the mock implementation object for vi.mock("../generated").
 * Call this to get a fresh mock setup for each test file.
 *
 * @example
 * ```typescript
 * import { createGeneratedApiMocks } from "@/test/mocks/api"
 *
 * vi.mock("../generated", () => createGeneratedApiMocks())
 * ```
 */
export function createGeneratedApiMocks(): Record<string, (...args: unknown[]) => unknown> {
  return {
    getApiV1Credentials: (...args: unknown[]) => mockGetApiV1Credentials(...args),
    postApiV1Credentials: (...args: unknown[]) => mockPostApiV1Credentials(...args),
    postApiV1CredentialsValidate: (...args: unknown[]) => mockPostApiV1CredentialsValidate(...args),
    deleteApiV1CredentialsByService: (...args: unknown[]) =>
      mockDeleteApiV1CredentialsByService(...args),
  };
}

/**
 * Resets all API mocks to their initial state.
 * Call this in beforeEach to ensure clean test isolation.
 */
export function resetApiMocks(): void {
  mockGetApiV1Credentials.mockReset();
  mockPostApiV1Credentials.mockReset();
  mockPostApiV1CredentialsValidate.mockReset();
  mockDeleteApiV1CredentialsByService.mockReset();
}
