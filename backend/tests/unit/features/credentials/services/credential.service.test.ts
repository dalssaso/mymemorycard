import { beforeEach, describe, expect, it, mock } from "bun:test";
import "reflect-metadata";

import { CredentialService } from "@/features/credentials/services/credential.service";
import type { ICredentialService } from "@/features/credentials/services/credential.service.interface";
import type { IUserCredentialRepository } from "@/features/credentials/repositories/user-credential.repository.interface";
import type { IEncryptionService } from "@/features/credentials/services/encryption.service.interface";
import type { UserApiCredential } from "@/features/credentials/types";
import type { IIgdbService } from "@/integrations/igdb";
import { NotFoundError, ValidationError } from "@/shared/errors/base";
import {
  createMockLogger,
  createMockEncryptionService,
  createMockIgdbService,
  createMockUserCredentialRepository,
} from "@/tests/helpers/repository.mocks";

describe("CredentialService", () => {
  let service: ICredentialService;
  let mockRepository: IUserCredentialRepository;
  let mockEncryption: IEncryptionService;
  let mockIgdbService: IIgdbService;

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

  beforeEach(() => {
    mockRepository = createMockUserCredentialRepository();
    mockEncryption = createMockEncryptionService();
    mockIgdbService = createMockIgdbService();
    service = new CredentialService(
      mockRepository,
      mockEncryption,
      mockIgdbService,
      createMockLogger()
    );
  });

  describe("listCredentials", () => {
    it("should return empty services array when no credentials", async () => {
      mockRepository.findByUser = mock().mockResolvedValue([]);

      const result = await service.listCredentials(testUserId);

      expect(result.services).toEqual([]);
    });

    it("should return credential status with snake_case fields", async () => {
      mockRepository.findByUser = mock().mockResolvedValue([testCredential]);

      const result = await service.listCredentials(testUserId);

      expect(result.services).toHaveLength(1);
      expect(result.services[0]).toMatchObject({
        service: "igdb",
        is_active: true,
        has_valid_token: true,
      });
      expect(result.services[0].token_expires_at).toBeDefined();
      expect(result.services[0].last_validated_at).toBeDefined();
    });
  });

  describe("saveCredentials", () => {
    it("should save IGDB credentials with encryption", async () => {
      const result = await service.saveCredentials(testUserId, {
        service: "igdb",
        credential_type: "twitch_oauth",
        credentials: {
          client_id: "test-client-id",
          client_secret: "test-client-secret",
        },
      });

      expect(result.service).toBe("igdb");
      expect(result.credential_type).toBe("twitch_oauth");
      expect(result.is_active).toBe(true);
      expect(mockEncryption.encrypt).toHaveBeenCalled();
    });

    it("should throw ValidationError for IGDB with wrong credential type", async () => {
      await expect(
        service.saveCredentials(testUserId, {
          service: "igdb",
          credential_type: "api_key",
          credentials: { api_key: "test" },
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for IGDB missing client_id", async () => {
      await expect(
        service.saveCredentials(testUserId, {
          service: "igdb",
          credential_type: "twitch_oauth",
          credentials: { client_secret: "test" } as never,
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should save RetroAchievements credentials", async () => {
      const result = await service.saveCredentials(testUserId, {
        service: "retroachievements",
        credential_type: "api_key",
        credentials: {
          username: "testuser",
          api_key: "test-api-key",
        },
      });

      expect(result.service).toBe("retroachievements");
      expect(result.credential_type).toBe("api_key");
    });

    it("should throw ValidationError for RetroAchievements with wrong credential type", async () => {
      await expect(
        service.saveCredentials(testUserId, {
          service: "retroachievements",
          credential_type: "twitch_oauth",
          credentials: { client_id: "test", client_secret: "test" },
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should save RetroAchievements credentials with only api_key (username optional)", async () => {
      const result = await service.saveCredentials(testUserId, {
        service: "retroachievements",
        credential_type: "api_key",
        credentials: {
          api_key: "test-api-key",
        },
      });

      expect(result.service).toBe("retroachievements");
      expect(result.credential_type).toBe("api_key");
      expect(result.is_active).toBe(true);
    });

    it("should throw ValidationError for RetroAchievements missing api_key", async () => {
      await expect(
        service.saveCredentials(testUserId, {
          service: "retroachievements",
          credential_type: "api_key",
          credentials: { username: "testuser" } as never,
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should save Steam credentials with encryption", async () => {
      const result = await service.saveCredentials(testUserId, {
        service: "steam",
        credential_type: "steam_openid",
        credentials: {
          steam_id: "test-steam-id",
        },
      });

      expect(result.service).toBe("steam");
      expect(result.credential_type).toBe("steam_openid");
      expect(result.is_active).toBe(true);
      expect(mockEncryption.encrypt).toHaveBeenCalled();
    });

    it("should throw ValidationError for Steam with wrong credential type", async () => {
      await expect(
        service.saveCredentials(testUserId, {
          service: "steam",
          credential_type: "api_key",
          credentials: { api_key: "test" },
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for Steam missing steam_id", async () => {
      await expect(
        service.saveCredentials(testUserId, {
          service: "steam",
          credential_type: "steam_openid",
          credentials: {} as never,
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should save RAWG credentials with encryption", async () => {
      const result = await service.saveCredentials(testUserId, {
        service: "rawg",
        credential_type: "api_key",
        credentials: {
          api_key: "test-api-key",
        },
      });

      expect(result.service).toBe("rawg");
      expect(result.credential_type).toBe("api_key");
      expect(result.is_active).toBe(true);
      expect(mockEncryption.encrypt).toHaveBeenCalled();
    });

    it("should throw ValidationError for RAWG with wrong credential type", async () => {
      await expect(
        service.saveCredentials(testUserId, {
          service: "rawg",
          credential_type: "twitch_oauth",
          credentials: { client_id: "test", client_secret: "test" },
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for RAWG missing api_key", async () => {
      await expect(
        service.saveCredentials(testUserId, {
          service: "rawg",
          credential_type: "api_key",
          credentials: {} as never,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("validateCredentials", () => {
    it("should throw NotFoundError when credentials not found", async () => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(null);

      await expect(service.validateCredentials(testUserId, "igdb")).rejects.toThrow(NotFoundError);
    });

    it("should validate credentials and update status", async () => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(testCredential);
      mockEncryption.decrypt = mock().mockReturnValue({
        client_id: "test",
        client_secret: "test",
      });

      const result = await service.validateCredentials(testUserId, "igdb");

      expect(result.service).toBe("igdb");
      expect(result.valid).toBe(true);
      expect(result.has_valid_token).toBe(true);
      expect(mockRepository.updateValidationStatus).toHaveBeenCalled();
    });

    it("should throw ValidationError when decryption fails", async () => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(testCredential);
      mockEncryption.decrypt = mock().mockImplementation(() => {
        throw new Error("Decryption failed");
      });

      await expect(service.validateCredentials(testUserId, "igdb")).rejects.toThrow(
        ValidationError
      );
    });

    it("should validate IGDB credentials by calling authenticate", async () => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(testCredential);
      mockEncryption.decrypt = mock().mockReturnValue({
        client_id: "test",
        client_secret: "test",
      });

      const result = await service.validateCredentials(testUserId, "igdb");

      expect(result.valid).toBe(true);
      expect(mockIgdbService.authenticate).toHaveBeenCalled();
    });

    it("should return invalid when IGDB authentication fails", async () => {
      mockRepository.findByUserAndService = mock().mockResolvedValue(testCredential);
      mockEncryption.decrypt = mock().mockReturnValue({
        client_id: "test",
        client_secret: "test",
      });
      mockIgdbService.authenticate = mock().mockRejectedValue(new Error("Auth failed"));

      const result = await service.validateCredentials(testUserId, "igdb");

      expect(result.valid).toBe(false);
    });
  });

  describe("deleteCredentials", () => {
    it("should delete credentials successfully", async () => {
      await expect(service.deleteCredentials(testUserId, "igdb")).resolves.toBeUndefined();
      expect(mockRepository.delete).toHaveBeenCalledWith(testUserId, "igdb");
    });

    it("should propagate NotFoundError from repository", async () => {
      mockRepository.delete = mock().mockRejectedValue(new NotFoundError("Credential", "igdb"));

      await expect(service.deleteCredentials(testUserId, "igdb")).rejects.toThrow(NotFoundError);
    });
  });
});
