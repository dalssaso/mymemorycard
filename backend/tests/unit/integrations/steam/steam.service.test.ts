import { beforeEach, describe, expect, it, mock, afterEach } from "bun:test";
import "reflect-metadata";

import type { IUserCredentialRepository } from "@/features/credentials/repositories/user-credential.repository.interface";
import type { IEncryptionService } from "@/features/credentials/services/encryption.service.interface";
import type { UserApiCredential } from "@/features/credentials/types";
import type { IGameRepository } from "@/features/games/repositories/game.repository.interface";
import type { IStoreRepository } from "@/features/games/repositories/store.repository.interface";
import type { IUserGameRepository } from "@/features/games/repositories/user-game.repository.interface";
import type { IPlatformRepository } from "@/features/platforms/repositories/platform.repository.interface";
import { SteamService } from "@/integrations/steam/steam.service";
import type { ISteamService } from "@/integrations/steam/steam.service.interface";
import { NotFoundError, ValidationError } from "@/shared/errors/base";
import { STEAM_CREDENTIALS_FIXTURE } from "@/tests/helpers/steam.fixtures";
import {
  createMockEncryptionService,
  createMockGameRepository,
  createMockLogger,
  createMockPlatformRepository,
  createMockStoreRepository,
  createMockUserCredentialRepository,
  createMockUserGameRepository,
} from "@/tests/helpers/repository.mocks";

describe("SteamService", () => {
  let service: ISteamService;
  let mockCredentialRepository: IUserCredentialRepository;
  let mockEncryption: IEncryptionService;
  let mockGameRepository: IGameRepository;
  let mockUserGameRepository: IUserGameRepository;
  let mockPlatformRepository: IPlatformRepository;
  let mockStoreRepository: IStoreRepository;
  let originalEnv: string | undefined;

  const testUserId = "user-uuid-001";
  const testSteamId = "76561198012345678";

  const testCredential: UserApiCredential = {
    id: "cred-uuid-001",
    userId: testUserId,
    service: "steam",
    credentialType: "steam_openid",
    encryptedCredentials: "encrypted-steam-data",
    isActive: true,
    hasValidToken: true,
    tokenExpiresAt: null,
    lastValidatedAt: new Date("2026-01-18T12:00:00Z"),
    createdAt: new Date("2026-01-18T10:00:00Z"),
    updatedAt: new Date("2026-01-18T10:00:00Z"),
  };

  beforeEach(() => {
    // Save and clear STEAM_API_KEY to test missing API key scenarios
    originalEnv = process.env.STEAM_API_KEY;
    delete process.env.STEAM_API_KEY;

    mockCredentialRepository = createMockUserCredentialRepository();
    mockEncryption = createMockEncryptionService();
    mockEncryption.decrypt = mock().mockReturnValue(STEAM_CREDENTIALS_FIXTURE);
    mockGameRepository = createMockGameRepository();
    mockUserGameRepository = createMockUserGameRepository();
    mockPlatformRepository = createMockPlatformRepository();
    mockStoreRepository = createMockStoreRepository();

    service = new SteamService(
      mockCredentialRepository,
      mockEncryption,
      mockGameRepository,
      mockUserGameRepository,
      mockPlatformRepository,
      mockStoreRepository,
      createMockLogger()
    );
  });

  afterEach(() => {
    // Restore original STEAM_API_KEY
    if (originalEnv !== undefined) {
      process.env.STEAM_API_KEY = originalEnv;
    } else {
      delete process.env.STEAM_API_KEY;
    }
  });

  describe("getLoginUrl", () => {
    it("should generate valid Steam OpenID URL", () => {
      const returnUrl = "https://myapp.com/callback";
      const loginUrl = service.getLoginUrl(returnUrl);

      expect(loginUrl).toContain("https://steamcommunity.com/openid/login");
      expect(loginUrl).toContain("openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0");
      expect(loginUrl).toContain("openid.mode=checkid_setup");
      expect(loginUrl).toContain(`openid.return_to=${encodeURIComponent(returnUrl)}`);
      expect(loginUrl).toContain("openid.realm=https%3A%2F%2Fmyapp.com");
      expect(loginUrl).toContain(
        "openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select"
      );
      expect(loginUrl).toContain(
        "openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select"
      );
    });

    it("should use correct realm from return URL origin", () => {
      const returnUrl = "https://another-app.example.org:8080/auth/steam/callback";
      const loginUrl = service.getLoginUrl(returnUrl);

      expect(loginUrl).toContain(
        "openid.realm=" + encodeURIComponent("https://another-app.example.org:8080")
      );
    });
  });

  describe("linkAccount", () => {
    it("should throw ValidationError when Steam API key not configured", async () => {
      // STEAM_API_KEY is already deleted in beforeEach
      // linkAccount calls getPlayerSummary which catches the error and returns null
      // This then results in "Could not retrieve Steam profile information"
      await expect(service.linkAccount(testUserId, testSteamId)).rejects.toThrow(ValidationError);
      await expect(service.linkAccount(testUserId, testSteamId)).rejects.toThrow(
        "Could not retrieve Steam profile information"
      );
    });
  });

  describe("getCredentials (via importLibrary)", () => {
    it("should throw NotFoundError when credentials not found", async () => {
      mockCredentialRepository.findByUserAndService = mock().mockResolvedValue(null);

      await expect(service.importLibrary(testUserId)).rejects.toThrow(NotFoundError);
      await expect(service.importLibrary(testUserId)).rejects.toThrow("Steam credentials");
    });

    it("should throw ValidationError when decryption fails", async () => {
      mockCredentialRepository.findByUserAndService = mock().mockResolvedValue(testCredential);
      mockEncryption.decrypt = mock().mockImplementation(() => {
        throw new Error("Decryption failed");
      });

      await expect(service.importLibrary(testUserId)).rejects.toThrow(ValidationError);
      await expect(service.importLibrary(testUserId)).rejects.toThrow(
        "Failed to decrypt Steam credentials"
      );
    });

    it("should throw ValidationError when credentials missing steam_id", async () => {
      mockCredentialRepository.findByUserAndService = mock().mockResolvedValue(testCredential);
      mockEncryption.decrypt = mock().mockReturnValue({
        display_name: "TestPlayer",
        avatar_url: "https://example.com/avatar.jpg",
        // steam_id is missing
      });

      await expect(service.importLibrary(testUserId)).rejects.toThrow(ValidationError);
      await expect(service.importLibrary(testUserId)).rejects.toThrow(
        "Invalid Steam credentials format"
      );
    });
  });

  describe("getOwnedGames", () => {
    it("should return empty array when Steam API key not configured", async () => {
      // Method catches errors internally and returns empty array
      const result = await service.getOwnedGames(testSteamId);
      expect(result).toEqual([]);
    });
  });

  describe("getPlayerSummary", () => {
    it("should return null when Steam API key not configured", async () => {
      // Method catches errors internally and returns null
      const result = await service.getPlayerSummary(testSteamId);
      expect(result).toBeNull();
    });
  });

  describe("getAchievements", () => {
    it("should throw ValidationError when Steam API key not configured", async () => {
      await expect(service.getAchievements(730, testSteamId)).rejects.toThrow(ValidationError);
      await expect(service.getAchievements(730, testSteamId)).rejects.toThrow(
        "Steam API key not configured"
      );
    });
  });

  describe("syncAchievements", () => {
    it("should throw NotFoundError when game not found", async () => {
      mockCredentialRepository.findByUserAndService = mock().mockResolvedValue(testCredential);
      mockGameRepository.findById = mock().mockResolvedValue(null);

      await expect(service.syncAchievements(testUserId, "nonexistent-game-id")).rejects.toThrow(
        NotFoundError
      );
    });

    it("should throw ValidationError when game has no Steam App ID", async () => {
      mockCredentialRepository.findByUserAndService = mock().mockResolvedValue(testCredential);
      mockGameRepository.findById = mock().mockResolvedValue({
        id: "game-uuid-001",
        name: "Test Game",
        metadata_source: "manual",
        steam_app_id: null, // No Steam App ID
        created_at: new Date(),
        updated_at: new Date(),
      });

      await expect(service.syncAchievements(testUserId, "game-uuid-001")).rejects.toThrow(
        ValidationError
      );
      await expect(service.syncAchievements(testUserId, "game-uuid-001")).rejects.toThrow(
        "Game does not have a Steam App ID"
      );
    });
  });
});
