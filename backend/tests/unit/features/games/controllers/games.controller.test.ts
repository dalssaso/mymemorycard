import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import "reflect-metadata";

import { GamesController } from "@/features/games/controllers/games.controller";
import type { IGameMetadataService } from "@/features/games/services/game-metadata.service.interface";
import type { IGameRepository } from "@/features/games/repositories/game.repository.interface";
import type { IUserGameRepository } from "@/features/games/repositories/user-game.repository.interface";
import type { Game, UserGame, UserGameWithRelations } from "@/features/games/types";
import { createMockLogger } from "@/tests/helpers/repository.mocks";
import { container, resetContainer } from "@/container";
import type { ITokenService } from "@/features/auth/services/token.service.interface";
import type { IUserRepository } from "@/features/auth/repositories/user.repository.interface";
import {
  GAME_METADATA_SERVICE_TOKEN,
  GAME_REPOSITORY_TOKEN,
  USER_GAME_REPOSITORY_TOKEN,
  TOKEN_SERVICE_TOKEN,
  USER_REPOSITORY_TOKEN,
} from "@/container/tokens";
import { NotFoundError, ConflictError, ValidationError } from "@/shared/errors/base";
import { createErrorHandler } from "@/infrastructure/http/middleware/error.middleware";

const GAME_ID = "550e8400-e29b-41d4-a716-446655440010";
const USER_ID = "550e8400-e29b-41d4-a716-446655440030";
const USER_GAME_ID = "550e8400-e29b-41d4-a716-446655440020";
const PLATFORM_ID = "550e8400-e29b-41d4-a716-446655440000";
const STORE_ID = "550e8400-e29b-41d4-a716-446655440001";

function createMockGame(overrides?: Partial<Game>): Game {
  return {
    id: GAME_ID,
    igdb_id: 1020,
    rawg_id: 3328,
    name: "The Legend of Zelda: Breath of the Wild",
    slug: "the-legend-of-zelda-breath-of-the-wild",
    release_date: new Date("2017-03-03"),
    description: "An open-world action-adventure game",
    cover_art_url: "https://images.igdb.com/igdb/image/upload/...",
    background_image_url: "https://images.igdb.com/igdb/image/upload/...",
    metacritic_score: 97,
    opencritic_score: 96,
    esrb_rating: "E10+",
    series_name: "The Legend of Zelda",
    expected_playtime: 50,
    metadata_source: "igdb",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-15"),
    ...overrides,
  };
}

function createMockUserGame(overrides?: Partial<UserGame>): UserGame {
  return {
    id: USER_GAME_ID,
    user_id: USER_ID,
    game_id: GAME_ID,
    platform_id: PLATFORM_ID,
    store_id: STORE_ID,
    platform_game_id: "291570",
    owned: true,
    purchased_date: new Date("2024-01-01"),
    import_source: "steam",
    created_at: new Date("2024-01-15"),
    ...overrides,
  };
}

function createMockUserGameWithRelations(
  overrides?: Partial<UserGameWithRelations>
): UserGameWithRelations {
  return {
    ...createMockUserGame(),
    game: {
      id: GAME_ID,
      name: "The Legend of Zelda: Breath of the Wild",
      cover_art_url: "https://images.igdb.com/igdb/image/upload/...",
    },
    platform: {
      id: PLATFORM_ID,
      name: "PC (Windows)",
      abbreviation: "PC",
    },
    store: {
      id: STORE_ID,
      slug: "steam",
      display_name: "Steam",
    },
    ...overrides,
  };
}

describe("GamesController", () => {
  let controller: GamesController;
  let gameMetadataService: IGameMetadataService;
  let gameRepository: IGameRepository;
  let userGameRepository: IUserGameRepository;

  beforeEach(() => {
    resetContainer();

    container.registerInstance<ITokenService>(TOKEN_SERVICE_TOKEN, {
      generateToken: () => "token",
      verifyToken: () => ({ userId: USER_ID, username: "testuser" }),
    });

    container.registerInstance<IUserRepository>(USER_REPOSITORY_TOKEN, {
      findById: async () => ({
        id: USER_ID,
        username: "testuser",
        email: "test@example.com",
        passwordHash: "hash",
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: null,
      }),
      findByUsername: async () => null,
      create: async () => {
        throw new Error("not used");
      },
      exists: async () => false,
    });

    gameMetadataService = {
      searchGames: mock().mockResolvedValue([]),
      getGameDetails: mock().mockResolvedValue(null),
      importGame: mock().mockResolvedValue(createMockUserGame()),
      updateGameMetadata: mock().mockResolvedValue(createMockGame()),
      getOrCreatePlatform: mock().mockResolvedValue({
        id: PLATFORM_ID,
        igdb_platform_id: 6,
        name: "PC (Windows)",
        abbreviation: "PC",
        slug: "win",
        platform_family: "PC",
        color_primary: "#6B7280",
        created_at: null,
      }),
    };

    gameRepository = {
      findById: mock().mockResolvedValue(createMockGame()),
      findByIgdbId: mock().mockResolvedValue(null),
      findByRawgId: mock().mockResolvedValue(null),
      create: mock().mockResolvedValue(createMockGame()),
      update: mock().mockResolvedValue(createMockGame()),
      delete: mock().mockResolvedValue(true),
      search: mock().mockResolvedValue([]),
      list: mock().mockResolvedValue([]),
      count: mock().mockResolvedValue(0),
    };

    userGameRepository = {
      findById: mock().mockResolvedValue(createMockUserGame()),
      findByIdWithRelations: mock().mockResolvedValue(createMockUserGameWithRelations()),
      listByUserWithRelations: mock().mockResolvedValue([createMockUserGameWithRelations()]),
      findByUserGamePlatform: mock().mockResolvedValue(null),
      create: mock().mockResolvedValue(createMockUserGame()),
      update: mock().mockResolvedValue(createMockUserGame()),
      delete: mock().mockResolvedValue(true),
      listByUser: mock().mockResolvedValue([createMockUserGame()]),
      getByGameForUser: mock().mockResolvedValue([]),
      deleteAllByUser: mock().mockResolvedValue(0),
      countByUser: mock().mockResolvedValue(0),
    };

    container.registerInstance<IGameMetadataService>(
      GAME_METADATA_SERVICE_TOKEN,
      gameMetadataService
    );
    container.registerInstance<IGameRepository>(GAME_REPOSITORY_TOKEN, gameRepository);
    container.registerInstance<IUserGameRepository>(USER_GAME_REPOSITORY_TOKEN, userGameRepository);

    const logger = createMockLogger();
    controller = new GamesController(
      gameMetadataService,
      gameRepository,
      userGameRepository,
      logger
    );
    controller.router.onError(createErrorHandler(logger));
  });

  afterEach(() => {
    resetContainer();
  });

  describe("POST /games/search", () => {
    it("should search games with valid query", async () => {
      const searchResults = [
        {
          id: GAME_ID,
          igdb_id: 1020,
          name: "The Legend of Zelda: Breath of the Wild",
          slug: "zelda-botw",
          cover_art_url: "https://example.com/cover.jpg",
          release_date: "2017-03-03T00:00:00.000Z",
          platforms: [
            { igdb_platform_id: 6, name: "PC", abbreviation: "PC" },
            { igdb_platform_id: 7, name: "Nintendo Switch", abbreviation: "Switch" },
          ],
          franchise: "The Legend of Zelda",
          stores: [
            { slug: "steam", url: "https://store.steampowered.com/app/..." },
            { slug: "nintendo-eshop", url: "https://www.nintendo.com/..." },
          ],
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gameMetadataService.searchGames as any).mockResolvedValue(searchResults);

      const response = await controller.router.request("/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ query: "zelda", limit: 20 }),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as { results: unknown[] };
      expect(data.results).toBeDefined();
      expect(data.results.length).toBeGreaterThan(0);
    });

    it("should return 400 for empty query", async () => {
      const response = await controller.router.request("/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ query: "" }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for query exceeding max length", async () => {
      const response = await controller.router.request("/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ query: "a".repeat(256) }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 401 when missing auth", async () => {
      const response = await controller.router.request("/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "zelda" }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 400 for validation error (credentials)", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gameMetadataService.searchGames as any).mockRejectedValue(
        new ValidationError("IGDB credentials not configured")
      );

      const response = await controller.router.request("/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ query: "zelda" }),
      });

      expect(response.status).toBe(400);
    });

    it("should use default limit when not provided", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gameMetadataService.searchGames as any).mockResolvedValue([]);

      await controller.router.request("/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ query: "zelda" }),
      });

      expect(gameMetadataService.searchGames).toHaveBeenCalledWith("zelda", USER_ID, 20);
    });
  });

  describe("GET /games/:id", () => {
    it("should get game details successfully", async () => {
      const response = await controller.router.request(`/${GAME_ID}`, {
        method: "GET",
        headers: {
          Authorization: "Bearer token",
        },
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as { game: Game };
      expect(data.game).toBeDefined();
      expect(data.game.id).toBe(GAME_ID);
    });

    it("should return 400 for invalid UUID", async () => {
      const response = await controller.router.request("/invalid-uuid", {
        method: "GET",
        headers: {
          Authorization: "Bearer token",
        },
      });

      expect(response.status).toBe(400);
    });

    it("should return 401 when missing auth", async () => {
      const response = await controller.router.request(`/${GAME_ID}`, {
        method: "GET",
      });

      expect(response.status).toBe(401);
    });

    it("should return 404 when game not found", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gameRepository.findById as any).mockResolvedValue(null);

      const response = await controller.router.request(`/${GAME_ID}`, {
        method: "GET",
        headers: {
          Authorization: "Bearer token",
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /games/:id/import", () => {
    it("should import game successfully", async () => {
      const response = await controller.router.request(`/${GAME_ID}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({
          igdb_id: 1020,
          platform_id: PLATFORM_ID,
          store_id: STORE_ID,
        }),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as { id: string };
      expect(data.id).toBe(USER_GAME_ID);
    });

    it("should return 400 for invalid igdb_id", async () => {
      const response = await controller.router.request(`/${GAME_ID}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({
          igdb_id: -1,
          platform_id: PLATFORM_ID,
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid platform_id format", async () => {
      const response = await controller.router.request(`/${GAME_ID}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({
          igdb_id: 1020,
          platform_id: "not-a-uuid",
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 401 when missing auth", async () => {
      const response = await controller.router.request(`/${GAME_ID}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          igdb_id: 1020,
          platform_id: PLATFORM_ID,
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 404 when platform not found", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gameMetadataService.importGame as any).mockRejectedValue(new NotFoundError("Platform"));

      const response = await controller.router.request(`/${GAME_ID}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({
          igdb_id: 1020,
          platform_id: PLATFORM_ID,
        }),
      });

      expect(response.status).toBe(404);
    });

    it("should return 404 when store not found", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gameMetadataService.importGame as any).mockRejectedValue(new NotFoundError("Store"));

      const response = await controller.router.request(`/${GAME_ID}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({
          igdb_id: 1020,
          platform_id: PLATFORM_ID,
          store_id: STORE_ID,
        }),
      });

      expect(response.status).toBe(404);
    });

    it("should return 400 for validation error (credentials)", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gameMetadataService.importGame as any).mockRejectedValue(
        new ValidationError("IGDB credentials not configured")
      );

      const response = await controller.router.request(`/${GAME_ID}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({
          igdb_id: 1020,
          platform_id: PLATFORM_ID,
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should allow optional store_id", async () => {
      const response = await controller.router.request(`/${GAME_ID}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({
          igdb_id: 1020,
          platform_id: PLATFORM_ID,
        }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe("POST /games/:id/metadata", () => {
    it("should update game metadata successfully", async () => {
      const response = await controller.router.request(`/${GAME_ID}/metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as { game: Game };
      expect(data.game).toBeDefined();
      expect(data.game.id).toBe(GAME_ID);
    });

    it("should return 400 for invalid game ID", async () => {
      const response = await controller.router.request("/invalid-uuid/metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it("should return 401 when missing auth", async () => {
      const response = await controller.router.request(`/${GAME_ID}/metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(401);
    });

    it("should return 404 when game not found", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gameMetadataService.updateGameMetadata as any).mockRejectedValue(new NotFoundError("Game"));

      const response = await controller.router.request(`/${GAME_ID}/metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(404);
    });

    it("should return 400 for validation error (credentials)", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gameMetadataService.updateGameMetadata as any).mockRejectedValue(
        new ValidationError("IGDB credentials not configured")
      );

      const response = await controller.router.request(`/${GAME_ID}/metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /user-games", () => {
    it("should add game to user library successfully", async () => {
      const response = await controller.router.request("/user-games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({
          game_id: GAME_ID,
          platform_id: PLATFORM_ID,
          store_id: STORE_ID,
        }),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as { id: string };
      expect(data.id).toBe(USER_GAME_ID);
    });

    it("should return 400 for invalid game_id", async () => {
      const response = await controller.router.request("/user-games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({
          game_id: "invalid-uuid",
          platform_id: PLATFORM_ID,
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid platform_id", async () => {
      const response = await controller.router.request("/user-games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({
          game_id: GAME_ID,
          platform_id: "invalid-uuid",
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 401 when missing auth", async () => {
      const response = await controller.router.request("/user-games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game_id: GAME_ID,
          platform_id: PLATFORM_ID,
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 404 when platform not found", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (userGameRepository.create as any).mockRejectedValue(new NotFoundError("Platform"));

      const response = await controller.router.request("/user-games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({
          game_id: GAME_ID,
          platform_id: PLATFORM_ID,
        }),
      });

      expect(response.status).toBe(404);
    });

    it("should allow optional store_id", async () => {
      const response = await controller.router.request("/user-games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({
          game_id: GAME_ID,
          platform_id: PLATFORM_ID,
        }),
      });

      expect(response.status).toBe(200);
    });

    it("should pass user_id to repository", async () => {
      await controller.router.request("/user-games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({
          game_id: GAME_ID,
          platform_id: PLATFORM_ID,
        }),
      });

      expect(userGameRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: USER_ID })
      );
    });
  });

  describe("GET /user-games", () => {
    it("should return 401 when missing auth", async () => {
      const response = await controller.router.request("/user-games", {
        method: "GET",
      });

      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid limit (non-numeric)", async () => {
      const response = await controller.router.request("/user-games?limit=abc", {
        method: "GET",
        headers: {
          Authorization: "Bearer token",
        },
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid offset (non-numeric)", async () => {
      const response = await controller.router.request("/user-games?offset=abc", {
        method: "GET",
        headers: {
          Authorization: "Bearer token",
        },
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for limit exceeding maximum", async () => {
      const response = await controller.router.request("/user-games?limit=600", {
        method: "GET",
        headers: {
          Authorization: "Bearer token",
        },
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for negative offset", async () => {
      const response = await controller.router.request("/user-games?offset=-5", {
        method: "GET",
        headers: {
          Authorization: "Bearer token",
        },
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /user-games/:id", () => {
    it("should get user game entry successfully", async () => {
      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "GET",
        headers: {
          Authorization: "Bearer token",
        },
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as UserGameWithRelations;
      expect(data.id).toBe(USER_GAME_ID);
    });

    it("should return 400 for invalid UUID", async () => {
      const response = await controller.router.request("/user-games/invalid-uuid", {
        method: "GET",
        headers: {
          Authorization: "Bearer token",
        },
      });

      expect(response.status).toBe(400);
    });

    it("should return 401 when missing auth", async () => {
      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "GET",
      });

      expect(response.status).toBe(401);
    });

    it("should return 404 when user game not found", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (userGameRepository.findByIdWithRelations as any).mockResolvedValue(null);

      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "GET",
        headers: {
          Authorization: "Bearer token",
        },
      });

      expect(response.status).toBe(404);
    });

    it("should return 404 for cross-user access (not 403)", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (userGameRepository.findByIdWithRelations as any).mockResolvedValue(
        createMockUserGameWithRelations({ user_id: "other-user-id" })
      );

      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "GET",
        headers: {
          Authorization: "Bearer token",
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /user-games/:id", () => {
    it("should update user game with owned field", async () => {
      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ owned: true }),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as UserGameWithRelations;
      expect(data.id).toBe(USER_GAME_ID);
    });

    it("should return 400 when no fields provided", async () => {
      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid owned value", async () => {
      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ owned: "not-boolean" }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid progress (negative)", async () => {
      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ progress: -1 }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid progress (over 100)", async () => {
      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ progress: 101 }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid rating (negative)", async () => {
      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ rating: -1 }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid rating (over 10)", async () => {
      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ rating: 11 }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 401 when missing auth", async () => {
      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ owned: true }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 404 when user game not found", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (userGameRepository.update as any).mockRejectedValue(new NotFoundError("User game"));

      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ owned: true }),
      });

      expect(response.status).toBe(404);
    });

    it("should return 409 conflict error", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (userGameRepository.update as any).mockRejectedValue(
        new ConflictError("Could not update user game")
      );

      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ owned: true }),
      });

      expect(response.status).toBe(409);
    });

    it("should pass userId to update method", async () => {
      await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ owned: true }),
      });

      expect(userGameRepository.update).toHaveBeenCalledWith(USER_GAME_ID, USER_ID, {
        owned: true,
        purchased_date: undefined,
      });
    });

    it("should pass purchased_date as Date when provided", async () => {
      await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
        body: JSON.stringify({ purchased_date: "2024-01-15T12:00:00.000Z" }),
      });

      expect(userGameRepository.update).toHaveBeenCalledWith(USER_GAME_ID, USER_ID, {
        owned: undefined,
        purchased_date: new Date("2024-01-15T12:00:00.000Z"),
      });
    });
  });

  describe("DELETE /user-games/:id", () => {
    it("should delete user game successfully with 204", async () => {
      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer token",
        },
      });

      expect(response.status).toBe(204);
      const text = await response.text();
      expect(text).toBe("");
    });

    it("should return 400 for invalid UUID", async () => {
      const response = await controller.router.request("/user-games/invalid-uuid", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer token",
        },
      });

      expect(response.status).toBe(400);
    });

    it("should return 401 when missing auth", async () => {
      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "DELETE",
      });

      expect(response.status).toBe(401);
    });

    it("should return 404 when user game not found", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (userGameRepository.delete as any).mockRejectedValue(new NotFoundError("User game"));

      const response = await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer token",
        },
      });

      expect(response.status).toBe(404);
    });

    it("should pass userId to delete method", async () => {
      await controller.router.request(`/user-games/${USER_GAME_ID}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer token",
        },
      });

      expect(userGameRepository.delete).toHaveBeenCalledWith(USER_GAME_ID, USER_ID);
    });
  });

  describe("Cross-cutting concerns", () => {
    it("should expose a router", () => {
      expect(controller.router).toBeDefined();
    });

    it("should inject all required dependencies", () => {
      expect(controller).toBeDefined();
      expect(gameMetadataService).toBeDefined();
      expect(gameRepository).toBeDefined();
      expect(userGameRepository).toBeDefined();
    });
  });
});
