import { vi, type MockInstance } from "vitest";

/**
 * Type alias for SDK mock functions.
 * Uses Vitest's MockInstance with explicit unknown generics to avoid implicit any.
 */
type SdkMockFn = MockInstance<(...args: unknown[]) => unknown>;

/**
 * Mock functions for the generated API SDK.
 * Use these to set up vi.mock for @/shared/api/generated.
 */
export const mockGetApiV1Credentials: SdkMockFn = vi.fn();
export const mockPostApiV1Credentials: SdkMockFn = vi.fn();
export const mockPostApiV1CredentialsValidate: SdkMockFn = vi.fn();
export const mockDeleteApiV1CredentialsByService: SdkMockFn = vi.fn();
export const mockGetApiV1Platforms: SdkMockFn = vi.fn();
export const mockGetApiV1PlatformsById: SdkMockFn = vi.fn();
export const mockPostApiV1GamesSearch: SdkMockFn = vi.fn();
export const mockGetApiV1UserGames: SdkMockFn = vi.fn();
export const mockPostApiV1GamesByIdImport: SdkMockFn = vi.fn();
export const mockGetApiV1UserGamesById: SdkMockFn = vi.fn();
export const mockPatchApiV1UserGamesById: SdkMockFn = vi.fn();
export const mockDeleteApiV1UserGamesById: SdkMockFn = vi.fn();
export const mockGetApiV1GamesById: SdkMockFn = vi.fn();

/**
 * Single source of truth mapping SDK function names to mock functions.
 * Adding a new mock only requires updating this object.
 */
const ALL_API_MOCKS: Record<string, SdkMockFn> = {
  getApiV1Credentials: mockGetApiV1Credentials,
  postApiV1Credentials: mockPostApiV1Credentials,
  postApiV1CredentialsValidate: mockPostApiV1CredentialsValidate,
  deleteApiV1CredentialsByService: mockDeleteApiV1CredentialsByService,
  getApiV1Platforms: mockGetApiV1Platforms,
  getApiV1PlatformsById: mockGetApiV1PlatformsById,
  postApiV1GamesSearch: mockPostApiV1GamesSearch,
  getApiV1UserGames: mockGetApiV1UserGames,
  postApiV1GamesByIdImport: mockPostApiV1GamesByIdImport,
  getApiV1UserGamesById: mockGetApiV1UserGamesById,
  patchApiV1UserGamesById: mockPatchApiV1UserGamesById,
  deleteApiV1UserGamesById: mockDeleteApiV1UserGamesById,
  getApiV1GamesById: mockGetApiV1GamesById,
};

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
export function createGeneratedApiMocks(): Record<string, SdkMockFn> {
  return { ...ALL_API_MOCKS };
}

/**
 * Resets all API mocks to their initial state.
 * Call this in beforeEach to ensure clean test isolation.
 */
export function resetApiMocks(): void {
  Object.values(ALL_API_MOCKS).forEach((mock) => mock.mockReset());
}
