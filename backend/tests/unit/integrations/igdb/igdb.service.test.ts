import { beforeEach, describe, expect, it, mock, afterEach } from "bun:test";
import "reflect-metadata";

import type { IUserCredentialRepository } from "@/features/credentials/repositories/user-credential.repository.interface";
import type { IEncryptionService } from "@/features/credentials/services/encryption.service.interface";
import type { UserApiCredential } from "@/features/credentials/types";
import { IgdbCache } from "@/integrations/igdb/igdb.cache";
import { IgdbService } from "@/integrations/igdb/igdb.service";
import type { IIgdbService } from "@/integrations/igdb/igdb.service.interface";
import { NotFoundError, ValidationError } from "@/shared/errors/base";
import {
  IGDB_GAME_FIXTURE,
  IGDB_PLATFORM_FIXTURE,
  IGDB_SEARCH_RESULTS_FIXTURE,
  IGDB_TOKEN_FIXTURE,
  IGDB_FRANCHISE_FIXTURE,
} from "@/tests/helpers/igdb.fixtures";
import {
  createMockEncryptionService,
  createMockLogger,
  createMockUserCredentialRepository,
} from "@/tests/helpers/repository.mocks";

describe("IgdbService", () => {
  let service: IIgdbService;
  let mockRepository: IUserCredentialRepository;
  let mockEncryption: IEncryptionService;
  let mockCache: IgdbCache;
  let mockFetch: ReturnType<typeof mock>;
  let originalFetch: typeof globalThis.fetch;

  const testUserId = "user-uuid-001";
  const testCredential: UserApiCredential = {
    id: "cred-uuid-001",
    userId: testUserId,
    service: "igdb",
    credentialType: "twitch_oauth",
    encryptedCredentials: "encrypted-data",
    isActive: true,
    hasValidToken: true,
    tokenExpiresAt: new Date("2026-03-16T12:00:00Z"),
    lastValidatedAt: new Date("2026-01-16T12:00:00Z"),
    createdAt: new Date("2026-01-16T10:00:00Z"),
    updatedAt: new Date("2026-01-16T10:00:00Z"),
  };

  const decryptedCredentials = {
    client_id: "test-client-id",
    client_secret: "test-client-secret",
  };

  function createMockCache(): IgdbCache {
    const mockRedis = {
      get: mock().mockResolvedValue(null),
      setEx: mock().mockResolvedValue("OK"),
      del: mock().mockResolvedValue(1),
    };
    return new IgdbCache(mockRedis as never);
  }

  beforeEach(() => {
    mockRepository = createMockUserCredentialRepository();
    mockEncryption = createMockEncryptionService();
    mockEncryption.decrypt = mock().mockReturnValue(decryptedCredentials);
    mockCache = createMockCache();

    // Store original fetch and replace with mock
    originalFetch = globalThis.fetch;
    mockFetch = mock();
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    service = new IgdbService(mockRepository, mockEncryption, createMockLogger(), mockCache);
  });

  afterEach(() => {
    // Restore original fetch
    globalThis.fetch = originalFetch;
  });

  describe("authenticate", () => {
    it("should return token on successful authentication", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => IGDB_TOKEN_FIXTURE,
      });

      const result = await service.authenticate(decryptedCredentials);

      expect(result.access_token).toBe(IGDB_TOKEN_FIXTURE.access_token);
      expect(result.expires_in).toBe(IGDB_TOKEN_FIXTURE.expires_in);
    });

    it("should throw ValidationError on auth failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Invalid client",
      });

      await expect(service.authenticate(decryptedCredentials)).rejects.toThrow(ValidationError);
    });

    it("should include client_id and client_secret in auth request URL", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => IGDB_TOKEN_FIXTURE,
      });

      await service.authenticate(decryptedCredentials);

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("client_id=test-client-id"), {
        method: "POST",
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("client_secret=test-client-secret"),
        { method: "POST" }
      );
    });
  });

  describe("searchGames", () => {
    beforeEach(() => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(testCredential);
    });

    it("should return search results", async () => {
      // First call for token, second for search
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_TOKEN_FIXTURE,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_SEARCH_RESULTS_FIXTURE,
        });

      const results = await service.searchGames("witcher", testUserId);

      expect(results).toHaveLength(2);
      expect(results[0].igdb_id).toBe(12345);
      expect(results[0].name).toBe("The Witcher 3: Wild Hunt");
    });

    it("should throw NotFoundError when credentials missing", async () => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(null);

      await expect(service.searchGames("witcher", testUserId)).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError when decryption fails", async () => {
      mockEncryption.decrypt = mock().mockImplementation(() => {
        throw new Error("Decryption failed");
      });

      await expect(service.searchGames("witcher", testUserId)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when credentials missing client_id", async () => {
      mockEncryption.decrypt = mock().mockReturnValue({ client_secret: "test" });

      await expect(service.searchGames("witcher", testUserId)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when credentials missing client_secret", async () => {
      mockEncryption.decrypt = mock().mockReturnValue({ client_id: "test" });

      await expect(service.searchGames("witcher", testUserId)).rejects.toThrow(ValidationError);
    });

    it("should respect limit parameter", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_TOKEN_FIXTURE,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_SEARCH_RESULTS_FIXTURE,
        });

      await service.searchGames("witcher", testUserId, 5);

      const secondCall = mockFetch.mock.calls[1];
      expect(secondCall[1]?.body).toContain("limit 5");
    });
  });

  describe("getGameDetails", () => {
    beforeEach(() => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(testCredential);
    });

    it("should return game details", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_TOKEN_FIXTURE,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [IGDB_GAME_FIXTURE],
        });

      const result = await service.getGameDetails(12345, testUserId);

      expect(result).not.toBeNull();
      expect(result!.igdb_id).toBe(12345);
      expect(result!.name).toBe("The Witcher 3: Wild Hunt");
      expect(result!.genres).toContain("Role-playing (RPG)");
    });

    it("should return null when game not found", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_TOKEN_FIXTURE,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      const result = await service.getGameDetails(99999, testUserId);

      expect(result).toBeNull();
    });

    it("should throw NotFoundError when credentials missing", async () => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(null);

      await expect(service.getGameDetails(12345, testUserId)).rejects.toThrow(NotFoundError);
    });
  });

  describe("getPlatform", () => {
    beforeEach(() => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(testCredential);
    });

    it("should return platform details", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_TOKEN_FIXTURE,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [IGDB_PLATFORM_FIXTURE],
        });

      const result = await service.getPlatform(6, testUserId);

      expect(result).not.toBeNull();
      expect(result!.igdb_platform_id).toBe(6);
      expect(result!.name).toBe("PC (Microsoft Windows)");
      expect(result!.platform_family).toBe("PC");
    });

    it("should return null when platform not found", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_TOKEN_FIXTURE,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      const result = await service.getPlatform(99999, testUserId);

      expect(result).toBeNull();
    });

    it("should throw NotFoundError when credentials missing", async () => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(null);

      await expect(service.getPlatform(6, testUserId)).rejects.toThrow(NotFoundError);
    });
  });

  describe("getPlatforms", () => {
    beforeEach(() => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(testCredential);
    });

    it("should return empty array for empty input", async () => {
      const result = await service.getPlatforms([], testUserId);
      expect(result).toEqual([]);
    });

    it("should return multiple platforms", async () => {
      const secondPlatform = {
        id: 48,
        name: "PlayStation 4",
        abbreviation: "PS4",
        slug: "ps4",
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_TOKEN_FIXTURE,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [IGDB_PLATFORM_FIXTURE, secondPlatform],
        });

      const result = await service.getPlatforms([6, 48], testUserId);

      expect(result).toHaveLength(2);
      expect(result[0].igdb_platform_id).toBe(6);
      expect(result[1].igdb_platform_id).toBe(48);
    });

    it("should throw NotFoundError when credentials missing", async () => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(null);

      await expect(service.getPlatforms([6, 48], testUserId)).rejects.toThrow(NotFoundError);
    });
  });

  describe("getFranchise", () => {
    beforeEach(() => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(testCredential);
    });

    it("should return franchise details", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_TOKEN_FIXTURE,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [IGDB_FRANCHISE_FIXTURE],
        });

      const result = await service.getFranchise(452, testUserId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(452);
      expect(result!.name).toBe("The Witcher");
    });

    it("should return null when franchise not found", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_TOKEN_FIXTURE,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      const result = await service.getFranchise(99999, testUserId);

      expect(result).toBeNull();
    });

    it("should throw NotFoundError when credentials missing", async () => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(null);

      await expect(service.getFranchise(452, testUserId)).rejects.toThrow(NotFoundError);
    });
  });

  describe("API error handling", () => {
    beforeEach(() => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(testCredential);
    });

    it("should throw ValidationError on 401 response", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_TOKEN_FIXTURE,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: async () => "Unauthorized",
        });

      await expect(service.searchGames("test", testUserId)).rejects.toThrow(ValidationError);
    });

    it("should throw Error on other API errors", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_TOKEN_FIXTURE,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => "Internal Server Error",
        });

      await expect(service.searchGames("test", testUserId)).rejects.toThrow("IGDB API error: 500");
    });

    it("should throw Error on 429 rate limit", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_TOKEN_FIXTURE,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => "Too Many Requests",
        });

      await expect(service.searchGames("test", testUserId)).rejects.toThrow("IGDB API error: 429");
    });

    it("should throw Error on 403 forbidden", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_TOKEN_FIXTURE,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: async () => "Forbidden",
        });

      await expect(service.searchGames("test", testUserId)).rejects.toThrow("IGDB API error: 403");
    });
  });

  describe("request headers", () => {
    beforeEach(() => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(testCredential);
    });

    it("should include Client-ID and Authorization headers", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_TOKEN_FIXTURE,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => IGDB_SEARCH_RESULTS_FIXTURE,
        });

      await service.searchGames("test", testUserId);

      const secondCall = mockFetch.mock.calls[1];
      expect(secondCall[1]?.headers).toMatchObject({
        "Client-ID": "test-client-id",
        Authorization: `Bearer ${IGDB_TOKEN_FIXTURE.access_token}`,
        "Content-Type": "text/plain",
      });
    });
  });
});
