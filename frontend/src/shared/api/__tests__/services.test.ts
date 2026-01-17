import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createGeneratedApiMocks,
  mockDeleteApiV1CredentialsByService,
  mockDeleteApiV1UserGamesById,
  mockGetApiV1Credentials,
  mockGetApiV1Platforms,
  mockGetApiV1PlatformsById,
  mockGetApiV1UserGames,
  mockGetApiV1UserGamesById,
  mockPatchApiV1UserGamesById,
  mockPostApiV1Credentials,
  mockPostApiV1CredentialsValidate,
  mockPostApiV1GamesByIdImport,
  mockPostApiV1GamesSearch,
} from "@/test/mocks/api";

// Mock the client module
vi.mock("../client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the generated SDK functions using shared helper
vi.mock("../generated", () => createGeneratedApiMocks());

import { AxiosError } from "axios";
import { apiClient } from "../client";
import {
  CredentialsService,
  GamesService,
  normalizeApiError,
  PlatformsService,
  StoresService,
} from "../services";

describe("API Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GamesService", () => {
    describe("search", () => {
      it("should call postApiV1GamesSearch SDK function with query", async () => {
        const mockData = {
          results: [
            {
              igdb_id: 1,
              name: "Zelda",
              cover_url: null,
              platforms: [],
              franchise: null,
              stores: [],
            },
          ],
        };
        mockPostApiV1GamesSearch.mockResolvedValue({ data: mockData });

        const result = await GamesService.search({ query: "zelda" });

        expect(mockPostApiV1GamesSearch).toHaveBeenCalledWith({
          body: { query: "zelda" },
          signal: undefined,
          throwOnError: true,
        });
        expect(result.games).toHaveLength(1);
        expect(result.games[0].igdb_id).toBe(1);
      });
    });

    describe("list", () => {
      it("should call getApiV1UserGames SDK function", async () => {
        const mockData = {
          user_games: [],
        };
        mockGetApiV1UserGames.mockResolvedValue({ data: mockData });

        const result = await GamesService.list();

        expect(mockGetApiV1UserGames).toHaveBeenCalledWith({
          query: undefined,
          throwOnError: true,
        });
        expect(result.games).toEqual([]);
      });

      it("should pass filter params to SDK", async () => {
        const mockData = { user_games: [] };
        mockGetApiV1UserGames.mockResolvedValue({ data: mockData });

        await GamesService.list({ status: "playing" });

        expect(mockGetApiV1UserGames).toHaveBeenCalledWith({
          query: { status: "playing" },
          throwOnError: true,
        });
      });
    });

    describe("getOne", () => {
      it("should call getApiV1UserGamesById SDK function", async () => {
        const mockData = {
          id: "game-123",
          user_id: "user-1",
          game: { id: "g-1", name: "Test Game", cover_art_url: null },
          platform: { id: "pc-1", name: "PC", abbreviation: null },
          store: { id: "steam-1", slug: "steam", display_name: "Steam" },
          platform_game_id: null,
          owned: true,
          purchased_date: null,
          import_source: null,
          created_at: "2026-01-01",
        };
        mockGetApiV1UserGamesById.mockResolvedValue({ data: mockData });

        const result = await GamesService.getOne("game-123");

        expect(mockGetApiV1UserGamesById).toHaveBeenCalledWith({
          path: { id: "game-123" },
          throwOnError: true,
        });
        expect(result.id).toBe("game-123");
        expect(result.name).toBe("Test Game");
      });
    });

    describe("create", () => {
      it("should call postApiV1GamesByIdImport SDK function", async () => {
        const payload = { igdb_id: 123, platform_id: "pc-1", store_id: "steam-1" };
        const mockData = {
          id: "game-1",
          user_id: "user-1",
          game: { id: "g-1", name: "Created Game", cover_art_url: null },
          platform: { id: "pc-1", name: "PC", abbreviation: null },
          store: { id: "steam-1", slug: "steam", display_name: "Steam" },
          platform_game_id: null,
          owned: true,
          purchased_date: null,
          import_source: null,
          created_at: "2026-01-01",
        };
        mockPostApiV1GamesByIdImport.mockResolvedValue({ data: mockData });

        const result = await GamesService.create(payload);

        expect(mockPostApiV1GamesByIdImport).toHaveBeenCalledWith({
          body: payload,
          throwOnError: true,
        });
        expect(result.id).toBe("game-1");
      });
    });

    describe("update", () => {
      it("should call patchApiV1UserGamesById SDK function", async () => {
        const payload = { status: "completed", rating: 5 };
        const mockData = {
          id: "game-123",
          user_id: "user-1",
          game: { id: "g-1", name: "Updated Game", cover_art_url: null },
          platform: { id: "pc-1", name: "PC", abbreviation: null },
          store: null,
          platform_game_id: null,
          owned: true,
          purchased_date: null,
          import_source: null,
          created_at: "2026-01-01",
        };
        mockPatchApiV1UserGamesById.mockResolvedValue({ data: mockData });

        const result = await GamesService.update("game-123", payload);

        expect(mockPatchApiV1UserGamesById).toHaveBeenCalledWith({
          path: { id: "game-123" },
          body: payload,
          throwOnError: true,
        });
        expect(result.id).toBe("game-123");
      });
    });

    describe("delete", () => {
      it("should call deleteApiV1UserGamesById SDK function", async () => {
        mockDeleteApiV1UserGamesById.mockResolvedValue({});

        await GamesService.delete("game-123");

        expect(mockDeleteApiV1UserGamesById).toHaveBeenCalledWith({
          path: { id: "game-123" },
          throwOnError: true,
        });
      });
    });
  });

  describe("CredentialsService", () => {
    describe("list", () => {
      it("should call getApiV1Credentials SDK function", async () => {
        const mockData = { services: [] };
        mockGetApiV1Credentials.mockResolvedValue({ data: mockData });

        const result = await CredentialsService.list();

        expect(mockGetApiV1Credentials).toHaveBeenCalledWith({ throwOnError: true });
        expect(result).toEqual(mockData);
      });
    });

    describe("create", () => {
      it("should call postApiV1Credentials SDK function with payload", async () => {
        const payload = {
          service: "igdb" as const,
          credential_type: "twitch_oauth" as const,
          credentials: {
            client_id: "test-id",
            client_secret: "test-secret",
          },
        };
        const mockData = { service: "igdb", is_active: true, message: "Saved" };
        mockPostApiV1Credentials.mockResolvedValue({ data: mockData });

        const result = await CredentialsService.create(payload);

        expect(mockPostApiV1Credentials).toHaveBeenCalledWith({
          body: payload,
          throwOnError: true,
        });
        expect(result).toEqual(mockData);
      });
    });

    describe("validate", () => {
      it("should call postApiV1CredentialsValidate SDK function with service", async () => {
        const mockData = { valid: true };
        mockPostApiV1CredentialsValidate.mockResolvedValue({ data: mockData });

        const result = await CredentialsService.validate("igdb");

        expect(mockPostApiV1CredentialsValidate).toHaveBeenCalledWith({
          body: { service: "igdb" },
          throwOnError: true,
        });
        expect(result).toEqual(mockData);
      });
    });

    describe("delete", () => {
      it("should call deleteApiV1CredentialsByService SDK function", async () => {
        mockDeleteApiV1CredentialsByService.mockResolvedValue({});

        await CredentialsService.delete("igdb");

        expect(mockDeleteApiV1CredentialsByService).toHaveBeenCalledWith({
          path: { service: "igdb" },
          throwOnError: true,
        });
      });
    });
  });

  describe("PlatformsService", () => {
    describe("list", () => {
      it("should call getApiV1Platforms SDK function", async () => {
        const mockData = { platforms: [] };
        mockGetApiV1Platforms.mockResolvedValue({ data: mockData });

        const result = await PlatformsService.list();

        expect(mockGetApiV1Platforms).toHaveBeenCalledWith({ throwOnError: true });
        expect(result).toEqual(mockData);
      });
    });

    describe("getOne", () => {
      it("should call getApiV1PlatformsById SDK function", async () => {
        const mockData = { id: "platform-1", name: "PC" };
        mockGetApiV1PlatformsById.mockResolvedValue({ data: mockData });

        const result = await PlatformsService.getOne("platform-1");

        expect(mockGetApiV1PlatformsById).toHaveBeenCalledWith({
          path: { id: "platform-1" },
          throwOnError: true,
        });
        expect(result).toEqual(mockData);
      });
    });
  });

  describe("StoresService", () => {
    describe("list", () => {
      it("should call GET /stores", async () => {
        const mockResponse = { data: { stores: [] } };
        vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

        const result = await StoresService.list();

        expect(apiClient.get).toHaveBeenCalledWith("/stores");
        expect(result).toEqual(mockResponse.data);
      });
    });
  });
});

describe("normalizeApiError", () => {
  it("should normalize Axios error with ErrorResponse data", () => {
    const axiosError = new AxiosError("Request failed");
    axiosError.response = {
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: { headers: {} } as AxiosError["response"] extends { config: infer C } ? C : never,
      data: {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: { field: "name" },
        request_id: "req-123",
      },
    };

    const result = normalizeApiError(axiosError);

    expect(result.name).toBe("ApiError");
    expect(result.message).toBe("Validation failed");
    expect(result.status).toBe(400);
    expect(result.code).toBe("VALIDATION_ERROR");
    expect(result.details).toEqual({ field: "name" });
    expect(result.requestId).toBe("req-123");
  });

  it("should normalize Axios error without response data", () => {
    const axiosError = new AxiosError("Network Error");

    const result = normalizeApiError(axiosError);

    expect(result.name).toBe("ApiError");
    expect(result.message).toBe("Network Error");
    expect(result.status).toBeNull();
    expect(result.code).toBeNull();
    expect(result.details).toBeNull();
    expect(result.requestId).toBeNull();
  });

  it("should normalize generic Error", () => {
    const error = new Error("Something went wrong");

    const result = normalizeApiError(error);

    expect(result.name).toBe("ApiError");
    expect(result.message).toBe("Something went wrong");
    expect(result.status).toBeNull();
    expect(result.code).toBeNull();
  });

  it("should handle unknown error types", () => {
    const result = normalizeApiError("string error");

    expect(result.name).toBe("ApiError");
    expect(result.message).toBe("An unexpected error occurred");
    expect(result.status).toBeNull();
  });
});
