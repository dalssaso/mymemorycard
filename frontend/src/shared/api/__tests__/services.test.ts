import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createGeneratedApiMocks,
  mockDeleteApiV1CredentialsByService,
  mockDeleteApiV1UserGamesById,
  mockGetApiV1Credentials,
  mockGetApiV1Platforms,
  mockGetApiV1PlatformsById,
  mockGetApiV1Stores,
  mockGetApiV1StoresById,
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

import { AxiosError, type InternalAxiosRequestConfig } from "axios";
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

      it("should propagate errors from SDK", async () => {
        mockPostApiV1GamesSearch.mockRejectedValue(new Error("Search failed"));

        await expect(GamesService.search({ query: "test" })).rejects.toThrow("Search failed");
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

      it("should propagate errors from SDK", async () => {
        mockGetApiV1UserGames.mockRejectedValue(new Error("List failed"));

        await expect(GamesService.list()).rejects.toThrow("List failed");
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

      it("should propagate errors from SDK", async () => {
        mockGetApiV1UserGamesById.mockRejectedValue(new Error("Game not found"));

        await expect(GamesService.getOne("nonexistent")).rejects.toThrow("Game not found");
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

      it("should propagate errors from SDK", async () => {
        const payload = { igdb_id: 123, platform_id: "pc-1" };
        mockPostApiV1GamesByIdImport.mockRejectedValue(new Error("Conflict"));

        await expect(GamesService.create(payload)).rejects.toThrow("Conflict");
      });

      it("should throw NormalizedApiError when platform_id is missing", async () => {
        const payload = { igdb_id: 123 };

        await expect(GamesService.create(payload)).rejects.toMatchObject({
          name: "ApiError",
          message: "platform_id is required for game import",
          status: 400,
          code: "VALIDATION_ERROR",
        });
        expect(mockPostApiV1GamesByIdImport).not.toHaveBeenCalled();
      });
    });

    describe("update", () => {
      it("should call patchApiV1UserGamesById SDK function", async () => {
        const payload = { owned: true, purchased_date: "2026-01-15" };
        const mockData = {
          id: "game-123",
          user_id: "user-1",
          game: { id: "g-1", name: "Updated Game", cover_art_url: null },
          platform: { id: "pc-1", name: "PC", abbreviation: null },
          store: null,
          platform_game_id: null,
          owned: true,
          purchased_date: "2026-01-15",
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

      it("should propagate errors from SDK", async () => {
        mockPatchApiV1UserGamesById.mockRejectedValue(new Error("Update failed"));

        await expect(GamesService.update("game-123", { owned: false })).rejects.toThrow(
          "Update failed"
        );
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

      it("should propagate errors from SDK", async () => {
        mockDeleteApiV1UserGamesById.mockRejectedValue(new Error("Delete failed"));

        await expect(GamesService.delete("game-123")).rejects.toThrow("Delete failed");
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

      it("should propagate errors from SDK", async () => {
        mockGetApiV1Credentials.mockRejectedValue(new Error("Credentials fetch failed"));

        await expect(CredentialsService.list()).rejects.toThrow("Credentials fetch failed");
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

      it("should propagate errors from SDK", async () => {
        const payload = {
          service: "igdb" as const,
          credential_type: "twitch_oauth" as const,
          credentials: { client_id: "test", client_secret: "test" },
        };
        mockPostApiV1Credentials.mockRejectedValue(new Error("Save failed"));

        await expect(CredentialsService.create(payload)).rejects.toThrow("Save failed");
      });
    });

    describe("validate", () => {
      it("should call postApiV1CredentialsValidate SDK function with service", async () => {
        const mockData = { is_valid: true };
        mockPostApiV1CredentialsValidate.mockResolvedValue({ data: mockData });

        const result = await CredentialsService.validate("igdb");

        expect(mockPostApiV1CredentialsValidate).toHaveBeenCalledWith({
          body: { service: "igdb" },
          throwOnError: true,
        });
        expect(result).toEqual(mockData);
      });

      it("should propagate errors from SDK", async () => {
        mockPostApiV1CredentialsValidate.mockRejectedValue(new Error("Validation failed"));

        await expect(CredentialsService.validate("igdb")).rejects.toThrow("Validation failed");
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

      it("should propagate errors from SDK", async () => {
        mockDeleteApiV1CredentialsByService.mockRejectedValue(new Error("Delete failed"));

        await expect(CredentialsService.delete("igdb")).rejects.toThrow("Delete failed");
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

      it("should propagate errors from SDK", async () => {
        mockGetApiV1Platforms.mockRejectedValue(new Error("Platforms fetch failed"));

        await expect(PlatformsService.list()).rejects.toThrow("Platforms fetch failed");
        expect(mockGetApiV1Platforms).toHaveBeenCalledWith({ throwOnError: true });
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

      it("should propagate errors from SDK", async () => {
        mockGetApiV1PlatformsById.mockRejectedValue(new Error("Platform fetch failed"));

        await expect(PlatformsService.getOne("platform-1")).rejects.toThrow(
          "Platform fetch failed"
        );
        expect(mockGetApiV1PlatformsById).toHaveBeenCalledWith({
          path: { id: "platform-1" },
          throwOnError: true,
        });
      });
    });
  });

  describe("StoresService", () => {
    describe("list", () => {
      it("should call getApiV1Stores SDK function", async () => {
        const mockData = {
          stores: [
            {
              id: "store-1",
              slug: "steam",
              display_name: "Steam",
              store_type: "digital",
              platform_family: "PC",
              color_primary: "#1b2838",
              website_url: "https://store.steampowered.com",
              icon_url: "https://example.com/steam.png",
              supports_achievements: true,
              supports_library_sync: true,
              igdb_website_category: 13,
              sort_order: 1,
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
        };
        mockGetApiV1Stores.mockResolvedValue({ data: mockData });

        const result = await StoresService.list();

        expect(mockGetApiV1Stores).toHaveBeenCalledWith({ throwOnError: true });
        expect(result.stores).toHaveLength(1);
        expect(result.stores[0].id).toBe("store-1");
        expect(result.stores[0].name).toBe("Steam");
      });

      it("should propagate errors from SDK", async () => {
        mockGetApiV1Stores.mockRejectedValue(new Error("Stores fetch failed"));

        await expect(StoresService.list()).rejects.toThrow("Stores fetch failed");
      });
    });

    describe("getOne", () => {
      it("should call getApiV1StoresById SDK function", async () => {
        const mockData = {
          store: {
            id: "store-1",
            slug: "steam",
            display_name: "Steam",
            store_type: "digital",
            platform_family: "PC",
            color_primary: "#1b2838",
            website_url: "https://store.steampowered.com",
            icon_url: "https://example.com/steam.png",
            supports_achievements: true,
            supports_library_sync: true,
            igdb_website_category: 13,
            sort_order: 1,
            created_at: "2026-01-01T00:00:00Z",
          },
        };
        mockGetApiV1StoresById.mockResolvedValue({ data: mockData });

        const result = await StoresService.getOne("store-1");

        expect(mockGetApiV1StoresById).toHaveBeenCalledWith({
          path: { id: "store-1" },
          throwOnError: true,
        });
        expect(result.id).toBe("store-1");
        expect(result.name).toBe("Steam");
      });

      it("should propagate errors from SDK", async () => {
        mockGetApiV1StoresById.mockRejectedValue(new Error("Store not found"));

        await expect(StoresService.getOne("nonexistent")).rejects.toThrow("Store not found");
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
      config: {} as InternalAxiosRequestConfig,
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
