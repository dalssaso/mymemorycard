import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the client module
vi.mock("../client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the generated SDK functions
const mockGetApiV1Credentials = vi.fn();
const mockPostApiV1Credentials = vi.fn();
const mockPostApiV1CredentialsValidate = vi.fn();
const mockDeleteApiV1CredentialsByService = vi.fn();

vi.mock("../generated", () => ({
  getApiV1Credentials: (...args: unknown[]) => mockGetApiV1Credentials(...args),
  postApiV1Credentials: (...args: unknown[]) => mockPostApiV1Credentials(...args),
  postApiV1CredentialsValidate: (...args: unknown[]) => mockPostApiV1CredentialsValidate(...args),
  deleteApiV1CredentialsByService: (...args: unknown[]) =>
    mockDeleteApiV1CredentialsByService(...args),
}));

import { apiClient } from "../client";
import { CredentialsService, GamesService, PlatformsService, StoresService } from "../services";

describe("API Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GamesService", () => {
    describe("search", () => {
      it("should call GET /games/search with query params", async () => {
        const mockResponse = { data: { games: [{ igdb_id: 1, name: "Zelda" }] } };
        vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

        const result = await GamesService.search({ query: "zelda" });

        expect(apiClient.get).toHaveBeenCalledWith("/games/search", {
          params: { query: "zelda" },
        });
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe("list", () => {
      it("should call GET /games without params when none provided", async () => {
        const mockResponse = { data: { games: [], total: 0, page: 1, per_page: 20 } };
        vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

        const result = await GamesService.list();

        expect(apiClient.get).toHaveBeenCalledWith("/games", {
          params: undefined,
        });
        expect(result).toEqual(mockResponse.data);
      });

      it("should call GET /games with optional params", async () => {
        const mockResponse = { data: { games: [], total: 0, page: 2, per_page: 10 } };
        vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

        const result = await GamesService.list({ page: 2, per_page: 10 });

        expect(apiClient.get).toHaveBeenCalledWith("/games", {
          params: { page: 2, per_page: 10 },
        });
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe("getOne", () => {
      it("should call GET /games/:id and return game", async () => {
        const mockGame = { id: "game-123", name: "Test Game" };
        const mockResponse = { data: { game: mockGame } };
        vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

        const result = await GamesService.getOne("game-123");

        expect(apiClient.get).toHaveBeenCalledWith("/games/game-123");
        expect(result).toEqual(mockGame);
      });
    });

    describe("create", () => {
      it("should call POST /games with payload and return game", async () => {
        const payload = { igdb_id: 123, platform_id: "pc-1" };
        const mockGame = { id: "game-1", name: "Created Game", ...payload };
        const mockResponse = { data: { game: mockGame } };
        vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

        const result = await GamesService.create(payload);

        expect(apiClient.post).toHaveBeenCalledWith("/games", payload);
        expect(result).toEqual(mockGame);
      });
    });

    describe("update", () => {
      it("should call PATCH /games/:id with payload and return updated game", async () => {
        const payload = { status: "completed", rating: 5 };
        const mockGame = { id: "game-123", name: "Updated Game", ...payload };
        const mockResponse = { data: { game: mockGame } };
        vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

        const result = await GamesService.update("game-123", payload);

        expect(apiClient.patch).toHaveBeenCalledWith("/games/game-123", payload);
        expect(result).toEqual(mockGame);
      });
    });

    describe("delete", () => {
      it("should call DELETE /games/:id", async () => {
        vi.mocked(apiClient.delete).mockResolvedValue({});

        await GamesService.delete("game-123");

        expect(apiClient.delete).toHaveBeenCalledWith("/games/game-123");
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
      it("should call GET /platforms", async () => {
        const mockResponse = { data: { platforms: [] } };
        vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

        const result = await PlatformsService.list();

        expect(apiClient.get).toHaveBeenCalledWith("/platforms");
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe("getOne", () => {
      it("should call GET /platforms/:id", async () => {
        const mockResponse = { data: { id: "platform-1", name: "PC" } };
        vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

        const result = await PlatformsService.getOne("platform-1");

        expect(apiClient.get).toHaveBeenCalledWith("/platforms/platform-1");
        expect(result).toEqual(mockResponse.data);
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
