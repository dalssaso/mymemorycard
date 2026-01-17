import { vi } from "vitest";

/**
 * Mock functions for the generated API SDK.
 * Use these to set up vi.mock for @/shared/api/generated.
 */
export const mockGetApiV1Credentials = vi.fn();
export const mockPostApiV1Credentials = vi.fn();
export const mockPostApiV1CredentialsValidate = vi.fn();
export const mockDeleteApiV1CredentialsByService = vi.fn();
export const mockGetApiV1Platforms = vi.fn();
export const mockGetApiV1PlatformsById = vi.fn();
export const mockPostApiV1GamesSearch = vi.fn();
export const mockGetApiV1UserGames = vi.fn();
export const mockPostApiV1GamesByIdImport = vi.fn();
export const mockGetApiV1UserGamesById = vi.fn();
export const mockPatchApiV1UserGamesById = vi.fn();
export const mockDeleteApiV1UserGamesById = vi.fn();
export const mockGetApiV1GamesById = vi.fn();

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
    getApiV1Platforms: (...args: unknown[]) => mockGetApiV1Platforms(...args),
    getApiV1PlatformsById: (...args: unknown[]) => mockGetApiV1PlatformsById(...args),
    postApiV1GamesSearch: (...args: unknown[]) => mockPostApiV1GamesSearch(...args),
    getApiV1UserGames: (...args: unknown[]) => mockGetApiV1UserGames(...args),
    postApiV1GamesByIdImport: (...args: unknown[]) => mockPostApiV1GamesByIdImport(...args),
    getApiV1UserGamesById: (...args: unknown[]) => mockGetApiV1UserGamesById(...args),
    patchApiV1UserGamesById: (...args: unknown[]) => mockPatchApiV1UserGamesById(...args),
    deleteApiV1UserGamesById: (...args: unknown[]) => mockDeleteApiV1UserGamesById(...args),
    getApiV1GamesById: (...args: unknown[]) => mockGetApiV1GamesById(...args),
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
  mockGetApiV1Platforms.mockReset();
  mockGetApiV1PlatformsById.mockReset();
  mockPostApiV1GamesSearch.mockReset();
  mockGetApiV1UserGames.mockReset();
  mockPostApiV1GamesByIdImport.mockReset();
  mockGetApiV1UserGamesById.mockReset();
  mockPatchApiV1UserGamesById.mockReset();
  mockDeleteApiV1UserGamesById.mockReset();
  mockGetApiV1GamesById.mockReset();
}
