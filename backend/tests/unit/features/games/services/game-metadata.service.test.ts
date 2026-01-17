import { beforeEach, describe, expect, it } from "bun:test";
import "reflect-metadata";

import { GameMetadataService } from "@/features/games/services/game-metadata.service";
import type {
  IGameRepository,
  IUserGameRepository,
  IPlatformRepository,
  IStoreRepository,
} from "@/features/games/repositories";
import type { IIgdbService } from "@/integrations/igdb";
import type { ICredentialService } from "@/features/credentials/services/credential.service.interface";
import { NotFoundError, ValidationError } from "@/shared/errors/base";
import { createMockLogger, createMockIgdbService } from "@/tests/helpers/repository.mocks";
import type { Game, UserGame, Platform } from "@/features/games/types";
import type { CredentialStatusResponse } from "@/features/credentials/services/credential.service.interface";
import type {
  GameSearchResult,
  GameDetails,
  PlatformFromIgdb,
} from "@/integrations/igdb/igdb.mapper";
import { mock } from "bun:test";

describe("GameMetadataService", () => {
  let service: GameMetadataService;
  let gameRepository: IGameRepository;
  let userGameRepository: IUserGameRepository;
  let platformRepository: IPlatformRepository;
  let storeRepository: IStoreRepository;
  let igdbService: IIgdbService;
  let credentialService: ICredentialService;

  const testUserId = "550e8400-e29b-41d4-a716-446655440000";
  const testPlatformId = "550e8400-e29b-41d4-a716-446655440001";
  const testStoreId = "550e8400-e29b-41d4-a716-446655440002";
  const testGameId = "550e8400-e29b-41d4-a716-446655440003";

  const mockGame: Game = {
    id: testGameId,
    igdb_id: 1296,
    rawg_id: null,
    name: "The Witcher 3: Wild Hunt",
    slug: "the-witcher-3-wild-hunt",
    release_date: new Date("2015-05-19"),
    description: "An open-world RPG",
    cover_art_url: "https://example.com/cover.jpg",
    background_image_url: null,
    metacritic_score: 92,
    opencritic_score: 88,
    esrb_rating: "M",
    series_name: "The Witcher",
    expected_playtime: 100,
    metadata_source: "igdb",
    created_at: new Date("2026-01-16T10:00:00Z"),
    updated_at: new Date("2026-01-16T10:00:00Z"),
  };

  const mockUserGame: UserGame = {
    id: "550e8400-e29b-41d4-a716-446655440004",
    user_id: testUserId,
    game_id: testGameId,
    platform_id: testPlatformId,
    store_id: testStoreId,
    platform_game_id: null,
    owned: true,
    purchased_date: new Date("2026-01-15T10:00:00Z"),
    import_source: "igdb",
    created_at: new Date("2026-01-16T10:00:00Z"),
  };

  const mockPlatform: Platform = {
    id: testPlatformId,
    igdb_platform_id: 6,
    name: "PC",
    abbreviation: "PC",
    slug: "pc",
    platform_family: "pc",
    color_primary: "#999999",
    created_at: new Date("2026-01-16T10:00:00Z"),
  };

  const mockGameSearchResult: GameSearchResult = {
    igdb_id: 1296,
    name: "The Witcher 3: Wild Hunt",
    cover_url: "https://example.com/cover.jpg",
    platforms: [
      { igdb_platform_id: 6, name: "PC", abbreviation: "PC" },
      { igdb_platform_id: 48, name: "PlayStation 4", abbreviation: "PS4" },
    ],
    franchise: "The Witcher",
    stores: [],
  };

  const mockGameDetails: GameDetails = {
    igdb_id: 1296,
    name: "The Witcher 3: Wild Hunt",
    slug: "the-witcher-3-wild-hunt",
    summary: "An open-world RPG",
    storyline: null,
    cover_url: "https://example.com/cover.jpg",
    release_date: "2015-05-19",
    rating: 92,
    genres: ["Role-playing (RPG)"],
    themes: ["Fantasy"],
    game_modes: ["Single player"],
    platforms: [{ igdb_platform_id: 6, name: "PC", abbreviation: "PC" }],
    franchise: "The Witcher",
    stores: [],
  };

  const mockPlatformFromIgdb: PlatformFromIgdb = {
    igdb_platform_id: 6,
    name: "PC",
    abbreviation: "PC",
    slug: "pc",
    platform_family: "pc",
  };

  const validCredentials: CredentialStatusResponse = {
    services: [
      {
        service: "igdb",
        is_active: true,
        has_valid_token: true,
        token_expires_at: null,
        last_validated_at: new Date().toISOString(),
      },
    ],
  };

  const invalidCredentials: CredentialStatusResponse = {
    services: [
      {
        service: "igdb",
        is_active: false,
        has_valid_token: false,
        token_expires_at: null,
        last_validated_at: null,
      },
    ],
  };

  beforeEach(() => {
    gameRepository = {
      findById: mock().mockResolvedValue(null),
      findByIgdbId: mock().mockResolvedValue(null),
      findByRawgId: mock().mockResolvedValue(null),
      create: mock().mockResolvedValue(mockGame),
      update: mock().mockResolvedValue(mockGame),
      delete: mock().mockResolvedValue(true),
      search: mock().mockResolvedValue([]),
      list: mock().mockResolvedValue([]),
      count: mock().mockResolvedValue(0),
    };

    userGameRepository = {
      findById: mock().mockResolvedValue(null),
      findByUserGamePlatform: mock().mockResolvedValue(null),
      create: mock().mockResolvedValue(mockUserGame),
      update: mock().mockResolvedValue(mockUserGame),
      delete: mock().mockResolvedValue(true),
      listByUser: mock().mockResolvedValue([]),
      getByGameForUser: mock().mockResolvedValue([]),
      deleteAllByUser: mock().mockResolvedValue(0),
      countByUser: mock().mockResolvedValue(0),
    };

    platformRepository = {
      findById: mock().mockResolvedValue(null),
      findByIgdbId: mock().mockResolvedValue(null),
      getOrCreate: mock().mockResolvedValue(mockPlatform),
      list: mock().mockResolvedValue([]),
      findByFamily: mock().mockResolvedValue([]),
    };

    storeRepository = {
      findById: mock().mockResolvedValue(null),
      findBySlug: mock().mockResolvedValue(null),
      list: mock().mockResolvedValue([]),
      listByPlatformFamily: mock().mockResolvedValue([]),
      listWithAchievements: mock().mockResolvedValue([]),
    };

    igdbService = createMockIgdbService();

    credentialService = {
      listCredentials: mock().mockResolvedValue(validCredentials),
      saveCredentials: mock().mockResolvedValue({
        service: "igdb",
        credential_type: "twitch_oauth",
        is_active: true,
        message: "Credentials saved",
      }),
      validateCredentials: mock().mockResolvedValue({
        service: "igdb",
        valid: true,
        has_valid_token: true,
        token_expires_at: null,
        message: "Credentials valid",
      }),
      deleteCredentials: mock().mockResolvedValue(undefined),
    };

    service = new GameMetadataService(
      gameRepository,
      userGameRepository,
      platformRepository,
      storeRepository,
      igdbService,
      credentialService,
      createMockLogger()
    );
  });

  describe("searchGames", () => {
    it("should search games with valid query", async () => {
      const mockResults = [mockGameSearchResult];
      const searchGamesMock = mock().mockResolvedValue(mockResults);
      Object.assign(igdbService, { searchGames: searchGamesMock });

      const result = await service.searchGames("witcher", testUserId);

      expect(result).toEqual(mockResults);
      expect(credentialService.listCredentials).toHaveBeenCalledWith(testUserId);
      expect(igdbService.searchGames).toHaveBeenCalledWith("witcher", testUserId, 10);
    });

    it("should respect custom limit parameter", async () => {
      const mockResults = [mockGameSearchResult];
      const searchGamesMock = mock().mockResolvedValue(mockResults);
      Object.assign(igdbService, { searchGames: searchGamesMock });

      await service.searchGames("witcher", testUserId, 25);

      expect(igdbService.searchGames).toHaveBeenCalledWith("witcher", testUserId, 25);
    });

    it("should pass limit as-is to IGDB service", async () => {
      const mockResults = [mockGameSearchResult];
      const searchGamesMock = mock().mockResolvedValue(mockResults);
      Object.assign(igdbService, { searchGames: searchGamesMock });

      await service.searchGames("witcher", testUserId, 150);

      expect(igdbService.searchGames).toHaveBeenCalledWith("witcher", testUserId, 150);
    });

    it("should throw ValidationError when user has no IGDB credentials", async () => {
      const listCredentialsMock = mock().mockResolvedValue(invalidCredentials);
      Object.assign(credentialService, { listCredentials: listCredentialsMock });

      expect(service.searchGames("witcher", testUserId)).rejects.toThrow(ValidationError);
      expect(service.searchGames("witcher", testUserId)).rejects.toThrow(
        "User does not have valid IGDB credentials"
      );
    });

    it("should throw ValidationError when credentials not found", async () => {
      const listCredentialsMock = mock().mockResolvedValue({
        services: [],
      });
      Object.assign(credentialService, { listCredentials: listCredentialsMock });

      expect(service.searchGames("witcher", testUserId)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError on credential service error", async () => {
      const listCredentialsMock = mock().mockRejectedValue(new Error("Credential service error"));
      Object.assign(credentialService, { listCredentials: listCredentialsMock });

      expect(service.searchGames("witcher", testUserId)).rejects.toThrow(ValidationError);
    });
  });

  describe("getGameDetails", () => {
    it("should return game details for valid IGDB ID", async () => {
      const getGameDetailsMock = mock().mockResolvedValue(mockGameDetails);
      Object.assign(igdbService, { getGameDetails: getGameDetailsMock });

      const result = await service.getGameDetails(1296, testUserId);

      expect(result).toEqual(mockGameDetails);
      expect(credentialService.listCredentials).toHaveBeenCalledWith(testUserId);
      expect(igdbService.getGameDetails).toHaveBeenCalledWith(1296, testUserId);
    });

    it("should return null when game not found on IGDB", async () => {
      const getGameDetailsMock = mock().mockResolvedValue(null);
      Object.assign(igdbService, { getGameDetails: getGameDetailsMock });

      const result = await service.getGameDetails(999999, testUserId);

      expect(result).toBeNull();
    });

    it("should throw ValidationError when user has no IGDB credentials", async () => {
      const listCredentialsMock = mock().mockResolvedValue(invalidCredentials);
      Object.assign(credentialService, { listCredentials: listCredentialsMock });

      expect(service.getGameDetails(1296, testUserId)).rejects.toThrow(ValidationError);
      expect(service.getGameDetails(1296, testUserId)).rejects.toThrow(
        "User does not have valid IGDB credentials"
      );
    });

    it("should throw ValidationError on credential validation error", async () => {
      const listCredentialsMock = mock().mockRejectedValue(new Error("Network error"));
      Object.assign(credentialService, { listCredentials: listCredentialsMock });

      expect(service.getGameDetails(1296, testUserId)).rejects.toThrow(ValidationError);
    });
  });

  describe("importGame", () => {
    it("should import game successfully with platform and store", async () => {
      const findByIgdbIdMock = mock().mockResolvedValue(null);
      const createGameMock = mock().mockResolvedValue(mockGame);
      const findPlatformMock = mock().mockResolvedValue(mockPlatform);
      const findStoreMock = mock().mockResolvedValue({
        id: testStoreId,
        slug: "steam",
        display_name: "Steam",
      });
      const createUserGameMock = mock().mockResolvedValue(mockUserGame);
      const getGameDetailsMock = mock().mockResolvedValue(mockGameDetails);

      Object.assign(gameRepository, { findByIgdbId: findByIgdbIdMock, create: createGameMock });
      Object.assign(platformRepository, { findById: findPlatformMock });
      Object.assign(storeRepository, { findById: findStoreMock });
      Object.assign(userGameRepository, { create: createUserGameMock });
      Object.assign(igdbService, { getGameDetails: getGameDetailsMock });

      const result = await service.importGame(1296, testUserId, testPlatformId, testStoreId);

      expect(result).toEqual(mockUserGame);
      expect(gameRepository.create).toHaveBeenCalledWith({
        igdb_id: 1296,
        name: "The Witcher 3: Wild Hunt",
        slug: "the-witcher-3-wild-hunt",
        release_date: new Date("2015-05-19"),
        description: "An open-world RPG",
        cover_art_url: "https://example.com/cover.jpg",
        metadata_source: "igdb",
      });
      expect(userGameRepository.create).toHaveBeenCalledWith({
        user_id: testUserId,
        game_id: testGameId,
        platform_id: testPlatformId,
        store_id: testStoreId,
        owned: true,
        import_source: "igdb",
      });
    });

    it("should import game without store", async () => {
      const findByIgdbIdMock = mock().mockResolvedValue(null);
      const createGameMock = mock().mockResolvedValue(mockGame);
      const findPlatformMock = mock().mockResolvedValue(mockPlatform);
      const createUserGameMock = mock().mockResolvedValue(mockUserGame);
      const getGameDetailsMock = mock().mockResolvedValue(mockGameDetails);

      Object.assign(gameRepository, { findByIgdbId: findByIgdbIdMock, create: createGameMock });
      Object.assign(platformRepository, { findById: findPlatformMock });
      Object.assign(userGameRepository, { create: createUserGameMock });
      Object.assign(igdbService, { getGameDetails: getGameDetailsMock });

      await service.importGame(1296, testUserId, testPlatformId);

      expect(userGameRepository.create).toHaveBeenCalledWith({
        user_id: testUserId,
        game_id: testGameId,
        platform_id: testPlatformId,
        store_id: undefined,
        owned: true,
        import_source: "igdb",
      });
    });

    it("should reuse existing game by IGDB ID", async () => {
      const findByIgdbIdMock = mock().mockResolvedValue(mockGame);
      const findPlatformMock = mock().mockResolvedValue(mockPlatform);
      const createUserGameMock = mock().mockResolvedValue(mockUserGame);
      const getGameDetailsMock = mock().mockResolvedValue(mockGameDetails);

      Object.assign(gameRepository, { findByIgdbId: findByIgdbIdMock });
      Object.assign(platformRepository, { findById: findPlatformMock });
      Object.assign(userGameRepository, { create: createUserGameMock });
      Object.assign(igdbService, { getGameDetails: getGameDetailsMock });

      await service.importGame(1296, testUserId, testPlatformId);

      expect(gameRepository.create).not.toHaveBeenCalled();
      expect(gameRepository.findByIgdbId).toHaveBeenCalledWith(1296);
    });

    it("should throw NotFoundError when IGDB game not found", async () => {
      const getGameDetailsMock = mock().mockResolvedValue(null);
      Object.assign(igdbService, { getGameDetails: getGameDetailsMock });

      expect(service.importGame(999999, testUserId, testPlatformId)).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when platform not found", async () => {
      const findPlatformMock = mock().mockResolvedValue(null);
      const getGameDetailsMock = mock().mockResolvedValue(mockGameDetails);

      Object.assign(platformRepository, { findById: findPlatformMock });
      Object.assign(igdbService, { getGameDetails: getGameDetailsMock });

      expect(service.importGame(1296, testUserId, "invalid-id")).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when store not found", async () => {
      const findPlatformMock = mock().mockResolvedValue(mockPlatform);
      const findStoreMock = mock().mockResolvedValue(null);
      const getGameDetailsMock = mock().mockResolvedValue(mockGameDetails);

      Object.assign(platformRepository, { findById: findPlatformMock });
      Object.assign(storeRepository, { findById: findStoreMock });
      Object.assign(igdbService, { getGameDetails: getGameDetailsMock });

      expect(service.importGame(1296, testUserId, testPlatformId, "invalid-store")).rejects.toThrow(
        NotFoundError
      );
    });

    it("should throw ValidationError when user has no credentials", async () => {
      const listCredentialsMock = mock().mockResolvedValue(invalidCredentials);
      Object.assign(credentialService, { listCredentials: listCredentialsMock });

      expect(service.importGame(1296, testUserId, testPlatformId)).rejects.toThrow(ValidationError);
    });

    it("should handle game with storyline as description", async () => {
      const gameDetailsWithStoryline = {
        ...mockGameDetails,
        summary: null,
        storyline: "An epic story",
      };
      const findByIgdbIdMock = mock().mockResolvedValue(null);
      const createGameMock = mock().mockResolvedValue(mockGame);
      const findPlatformMock = mock().mockResolvedValue(mockPlatform);
      const createUserGameMock = mock().mockResolvedValue(mockUserGame);
      const getGameDetailsMock = mock().mockResolvedValue(gameDetailsWithStoryline);

      Object.assign(gameRepository, { findByIgdbId: findByIgdbIdMock, create: createGameMock });
      Object.assign(platformRepository, { findById: findPlatformMock });
      Object.assign(userGameRepository, { create: createUserGameMock });
      Object.assign(igdbService, { getGameDetails: getGameDetailsMock });

      await service.importGame(1296, testUserId, testPlatformId);

      expect(gameRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "An epic story",
        })
      );
    });
  });

  describe("updateGameMetadata", () => {
    it("should update game metadata from IGDB", async () => {
      const findByIdMock = mock().mockResolvedValue(mockGame);
      const getByGameForUserMock = mock().mockResolvedValue([mockUserGame]);
      const getGameDetailsMock = mock().mockResolvedValue(mockGameDetails);
      const updateMock = mock().mockResolvedValue(mockGame);

      Object.assign(gameRepository, { findById: findByIdMock, update: updateMock });
      Object.assign(userGameRepository, { getByGameForUser: getByGameForUserMock });
      Object.assign(igdbService, { getGameDetails: getGameDetailsMock });

      const result = await service.updateGameMetadata(testGameId, testUserId);

      expect(result).toEqual(mockGame);
      expect(gameRepository.findById).toHaveBeenCalledWith(testGameId);
      expect(userGameRepository.getByGameForUser).toHaveBeenCalledWith(testUserId, testGameId);
      expect(igdbService.getGameDetails).toHaveBeenCalledWith(mockGame.igdb_id, testUserId);
      expect(gameRepository.update).toHaveBeenCalledWith(
        testGameId,
        expect.objectContaining({
          name: "The Witcher 3: Wild Hunt",
          slug: "the-witcher-3-wild-hunt",
        })
      );
    });

    it("should throw NotFoundError when game not found", async () => {
      const findByIdMock = mock().mockResolvedValue(null);
      Object.assign(gameRepository, { findById: findByIdMock });

      expect(service.updateGameMetadata(testGameId, testUserId)).rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError when user doesn't own the game", async () => {
      const findByIdMock = mock().mockResolvedValue(mockGame);
      const getByGameForUserMock = mock().mockResolvedValue([]);

      Object.assign(gameRepository, { findById: findByIdMock });
      Object.assign(userGameRepository, { getByGameForUser: getByGameForUserMock });

      expect(service.updateGameMetadata(testGameId, testUserId)).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError when game has no IGDB ID", async () => {
      const gameWithoutIgdbId = { ...mockGame, igdb_id: null };
      const findByIdMock = mock().mockResolvedValue(gameWithoutIgdbId);
      const getByGameForUserMock = mock().mockResolvedValue([mockUserGame]);

      Object.assign(gameRepository, { findById: findByIdMock });
      Object.assign(userGameRepository, { getByGameForUser: getByGameForUserMock });

      expect(service.updateGameMetadata(testGameId, testUserId)).rejects.toThrow(ValidationError);
      expect(service.updateGameMetadata(testGameId, testUserId)).rejects.toThrow(
        "Cannot update game metadata: game not from IGDB"
      );
    });

    it("should throw NotFoundError when IGDB game not found", async () => {
      const findByIdMock = mock().mockResolvedValue(mockGame);
      const getByGameForUserMock = mock().mockResolvedValue([mockUserGame]);
      const getGameDetailsMock = mock().mockResolvedValue(null);

      Object.assign(gameRepository, { findById: findByIdMock });
      Object.assign(userGameRepository, { getByGameForUser: getByGameForUserMock });
      Object.assign(igdbService, { getGameDetails: getGameDetailsMock });

      expect(service.updateGameMetadata(testGameId, testUserId)).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError when user has no credentials", async () => {
      const listCredentialsMock = mock().mockResolvedValue(invalidCredentials);
      Object.assign(credentialService, { listCredentials: listCredentialsMock });

      expect(service.updateGameMetadata(testGameId, testUserId)).rejects.toThrow(ValidationError);
    });

    it("should update all metadata fields", async () => {
      const findByIdMock = mock().mockResolvedValue(mockGame);
      const getByGameForUserMock = mock().mockResolvedValue([mockUserGame]);
      const getGameDetailsMock = mock().mockResolvedValue(mockGameDetails);
      const updateMock = mock().mockResolvedValue(mockGame);

      Object.assign(gameRepository, { findById: findByIdMock, update: updateMock });
      Object.assign(userGameRepository, { getByGameForUser: getByGameForUserMock });
      Object.assign(igdbService, { getGameDetails: getGameDetailsMock });

      await service.updateGameMetadata(testGameId, testUserId);

      expect(gameRepository.update).toHaveBeenCalledWith(
        testGameId,
        expect.objectContaining({
          name: "The Witcher 3: Wild Hunt",
          slug: "the-witcher-3-wild-hunt",
          description: "An open-world RPG",
          cover_art_url: "https://example.com/cover.jpg",
        })
      );
    });
  });

  describe("getOrCreatePlatform", () => {
    it("should return platform when it exists or is created", async () => {
      const getOrCreateMock = mock().mockResolvedValue(mockPlatform);
      const getPlatformMock = mock().mockResolvedValue(mockPlatformFromIgdb);

      Object.assign(platformRepository, { getOrCreate: getOrCreateMock });
      Object.assign(igdbService, { getPlatform: getPlatformMock });

      const result = await service.getOrCreatePlatform(6, testUserId);

      expect(result).toEqual(mockPlatform);
      expect(credentialService.listCredentials).toHaveBeenCalledWith(testUserId);
      expect(igdbService.getPlatform).toHaveBeenCalledWith(6, testUserId);
    });

    it("should create new platform when it doesn't exist", async () => {
      const newPlatform = { ...mockPlatform, id: "new-id" };
      const getOrCreateMock = mock().mockResolvedValue(newPlatform);
      const getPlatformMock = mock().mockResolvedValue(mockPlatformFromIgdb);

      Object.assign(platformRepository, { getOrCreate: getOrCreateMock });
      Object.assign(igdbService, { getPlatform: getPlatformMock });

      const result = await service.getOrCreatePlatform(6, testUserId);

      expect(result.id).toBe("new-id");
      expect(platformRepository.getOrCreate).toHaveBeenCalledWith(
        6,
        "PC",
        expect.objectContaining({
          abbreviation: "PC",
          slug: "pc",
          platform_family: "pc",
          color_primary: "#999999",
        })
      );
    });

    it("should throw NotFoundError when IGDB platform not found", async () => {
      const getPlatformMock = mock().mockResolvedValue(null);
      Object.assign(igdbService, { getPlatform: getPlatformMock });

      expect(service.getOrCreatePlatform(999, testUserId)).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError when user has no credentials", async () => {
      const listCredentialsMock = mock().mockResolvedValue(invalidCredentials);
      Object.assign(credentialService, { listCredentials: listCredentialsMock });

      expect(service.getOrCreatePlatform(6, testUserId)).rejects.toThrow(ValidationError);
      expect(service.getOrCreatePlatform(6, testUserId)).rejects.toThrow(
        "User does not have valid IGDB credentials"
      );
    });

    it("should throw ValidationError on credential service error", async () => {
      const listCredentialsMock = mock().mockRejectedValue(new Error("Service error"));
      Object.assign(credentialService, { listCredentials: listCredentialsMock });

      expect(service.getOrCreatePlatform(6, testUserId)).rejects.toThrow(ValidationError);
    });

    it("should pass platform data with default color to repository", async () => {
      const getOrCreateMock = mock().mockResolvedValue(mockPlatform);
      const getPlatformMock = mock().mockResolvedValue(mockPlatformFromIgdb);

      Object.assign(platformRepository, { getOrCreate: getOrCreateMock });
      Object.assign(igdbService, { getPlatform: getPlatformMock });

      await service.getOrCreatePlatform(6, testUserId);

      expect(platformRepository.getOrCreate).toHaveBeenCalledWith(6, "PC", {
        abbreviation: "PC",
        slug: "pc",
        platform_family: "pc",
        color_primary: "#999999",
      });
    });
  });

  describe("credential validation", () => {
    it("should verify credentials are checked before calling IGDB service", async () => {
      const listCredentialsMock = mock().mockResolvedValue(invalidCredentials);
      Object.assign(credentialService, { listCredentials: listCredentialsMock });

      expect(service.searchGames("test", testUserId)).rejects.toThrow();

      expect(igdbService.searchGames).not.toHaveBeenCalled();
    });

    it("should handle missing IGDB service in credentials list", async () => {
      const listCredentialsMock = mock().mockResolvedValue({
        services: [
          {
            service: "steam",
            is_active: true,
            has_valid_token: true,
            token_expires_at: null,
            last_validated_at: null,
          },
        ],
      });
      Object.assign(credentialService, { listCredentials: listCredentialsMock });

      expect(service.searchGames("test", testUserId)).rejects.toThrow(ValidationError);
    });

    it("should require active token for credentials to be valid", async () => {
      const listCredentialsMock = mock().mockResolvedValue({
        services: [
          {
            service: "igdb",
            is_active: false,
            has_valid_token: true,
            token_expires_at: null,
            last_validated_at: null,
          },
        ],
      });
      Object.assign(credentialService, { listCredentials: listCredentialsMock });

      expect(service.searchGames("test", testUserId)).rejects.toThrow(ValidationError);
    });

    it("should require valid token for credentials", async () => {
      const listCredentialsMock = mock().mockResolvedValue({
        services: [
          {
            service: "igdb",
            is_active: true,
            has_valid_token: false,
            token_expires_at: null,
            last_validated_at: null,
          },
        ],
      });
      Object.assign(credentialService, { listCredentials: listCredentialsMock });

      expect(service.searchGames("test", testUserId)).rejects.toThrow(ValidationError);
    });
  });

  describe("cross-repository coordination", () => {
    it("should verify platform exists before creating user game", async () => {
      const findByIgdbIdMock = mock().mockResolvedValue(null);
      const createGameMock = mock().mockResolvedValue(mockGame);
      const findPlatformMock = mock().mockResolvedValue(null);
      const getGameDetailsMock = mock().mockResolvedValue(mockGameDetails);

      Object.assign(gameRepository, { findByIgdbId: findByIgdbIdMock, create: createGameMock });
      Object.assign(platformRepository, { findById: findPlatformMock });
      Object.assign(igdbService, { getGameDetails: getGameDetailsMock });

      expect(service.importGame(1296, testUserId, "invalid-id")).rejects.toThrow(NotFoundError);

      expect(userGameRepository.create).not.toHaveBeenCalled();
    });

    it("should verify store exists when provided", async () => {
      const findByIgdbIdMock = mock().mockResolvedValue(null);
      const createGameMock = mock().mockResolvedValue(mockGame);
      const findPlatformMock = mock().mockResolvedValue(mockPlatform);
      const findStoreMock = mock().mockResolvedValue(null);
      const getGameDetailsMock = mock().mockResolvedValue(mockGameDetails);

      Object.assign(gameRepository, { findByIgdbId: findByIgdbIdMock, create: createGameMock });
      Object.assign(platformRepository, { findById: findPlatformMock });
      Object.assign(storeRepository, { findById: findStoreMock });
      Object.assign(igdbService, { getGameDetails: getGameDetailsMock });

      expect(service.importGame(1296, testUserId, testPlatformId, "invalid-store")).rejects.toThrow(
        NotFoundError
      );

      expect(userGameRepository.create).not.toHaveBeenCalled();
    });

    it("should not verify store when not provided", async () => {
      const findByIgdbIdMock = mock().mockResolvedValue(null);
      const createGameMock = mock().mockResolvedValue(mockGame);
      const findPlatformMock = mock().mockResolvedValue(mockPlatform);
      const createUserGameMock = mock().mockResolvedValue(mockUserGame);
      const getGameDetailsMock = mock().mockResolvedValue(mockGameDetails);

      Object.assign(gameRepository, { findByIgdbId: findByIgdbIdMock, create: createGameMock });
      Object.assign(platformRepository, { findById: findPlatformMock });
      Object.assign(userGameRepository, { create: createUserGameMock });
      Object.assign(igdbService, { getGameDetails: getGameDetailsMock });

      await service.importGame(1296, testUserId, testPlatformId);

      expect(storeRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe("error handling and propagation", () => {
    it("should propagate NotFoundError from repositories", async () => {
      const error = new NotFoundError("Game", "123");
      const findByIdMock = mock().mockRejectedValue(error);
      Object.assign(gameRepository, { findById: findByIdMock });

      expect(service.updateGameMetadata(testGameId, testUserId)).rejects.toThrow(error);
    });

    it("should wrap credential service errors as ValidationError", async () => {
      const listCredentialsMock = mock().mockRejectedValue(new Error("Network timeout"));
      Object.assign(credentialService, { listCredentials: listCredentialsMock });

      expect(service.searchGames("test", testUserId)).rejects.toThrow(ValidationError);
      expect(service.searchGames("test", testUserId)).rejects.toThrow(
        "Failed to validate IGDB credentials"
      );
    });

    it("should preserve ValidationError from credential service", async () => {
      const validationError = new ValidationError("Invalid credentials");
      const listCredentialsMock = mock().mockRejectedValue(validationError);
      Object.assign(credentialService, { listCredentials: listCredentialsMock });

      expect(service.searchGames("test", testUserId)).rejects.toThrow(validationError);
    });
  });

  describe("authorization", () => {
    it("should verify user ownership before updating game metadata", async () => {
      const anotherUserId = "different-user-id";
      const findByIdMock = mock().mockResolvedValue(mockGame);
      const getByGameForUserMock = mock().mockResolvedValue([]);

      Object.assign(gameRepository, { findById: findByIdMock });
      Object.assign(userGameRepository, { getByGameForUser: getByGameForUserMock });

      expect(service.updateGameMetadata(testGameId, anotherUserId)).rejects.toThrow(NotFoundError);
    });

    it("should allow update when user owns at least one entry for game", async () => {
      const findByIdMock = mock().mockResolvedValue(mockGame);
      const getByGameForUserMock = mock().mockResolvedValue([mockUserGame]);
      const getGameDetailsMock = mock().mockResolvedValue(mockGameDetails);
      const updateMock = mock().mockResolvedValue(mockGame);

      Object.assign(gameRepository, { findById: findByIdMock, update: updateMock });
      Object.assign(userGameRepository, { getByGameForUser: getByGameForUserMock });
      Object.assign(igdbService, { getGameDetails: getGameDetailsMock });

      expect(service.updateGameMetadata(testGameId, testUserId)).resolves.toBeDefined();
    });

    it("should use user ID from parameter for credential lookup", async () => {
      const differentUserId = "different-user-id";
      const listCredentialsMock = mock().mockResolvedValue(invalidCredentials);
      Object.assign(credentialService, { listCredentials: listCredentialsMock });

      expect(service.searchGames("test", differentUserId)).rejects.toThrow();

      expect(credentialService.listCredentials).toHaveBeenCalledWith(differentUserId);
    });
  });

  describe("logging", () => {
    it("should initialize child logger with service name", () => {
      const logger = createMockLogger();
      const svc = new GameMetadataService(
        gameRepository,
        userGameRepository,
        platformRepository,
        storeRepository,
        igdbService,
        credentialService,
        logger
      );

      expect(logger.child).toHaveBeenCalledWith("GameMetadataService");
      expect(svc).toBeDefined();
    });
  });
});
