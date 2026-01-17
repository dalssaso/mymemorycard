import { beforeEach, describe, expect, it } from "bun:test";
import "reflect-metadata";

import { PostgresUserCredentialRepository } from "@/features/credentials/repositories/user-credential.repository";
import type { UserApiCredential } from "@/features/credentials/types";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import { NotFoundError } from "@/shared/errors/base";
import {
  createMockDrizzleDB,
  mockDeleteResult,
  mockSelectWhereOrderByResult,
  mockSelectWhereLimitResult,
  mockUpdateResult,
  mockUpsertResult,
} from "@/tests/helpers/drizzle.mocks";

describe("PostgresUserCredentialRepository", () => {
  let repository: PostgresUserCredentialRepository;
  let mockDb: DrizzleDB;

  const testUserId = "user-uuid-001";
  const testCredential: UserApiCredential = {
    id: "cred-uuid-001",
    userId: testUserId,
    service: "igdb",
    credentialType: "twitch_oauth",
    encryptedCredentials: "encrypted-data",
    isActive: true,
    hasValidToken: false,
    tokenExpiresAt: null,
    lastValidatedAt: null,
    createdAt: new Date("2026-01-16T10:00:00Z"),
    updatedAt: new Date("2026-01-16T10:00:00Z"),
  };

  beforeEach(() => {
    mockDb = createMockDrizzleDB();
    repository = new PostgresUserCredentialRepository(mockDb);
  });

  describe("findByUserAndService", () => {
    it("returns credential when found", async () => {
      mockSelectWhereLimitResult(mockDb, [testCredential]);

      const result = await repository.findByUserAndService(testUserId, "igdb");

      expect(result).toEqual(testCredential);
    });

    it("returns null when not found", async () => {
      mockSelectWhereLimitResult(mockDb, []);

      const result = await repository.findByUserAndService(testUserId, "igdb");

      expect(result).toBeNull();
    });
  });

  describe("findByUser", () => {
    it("returns all credentials for user", async () => {
      const credentials = [testCredential];
      mockSelectWhereOrderByResult(mockDb, credentials);

      const result = await repository.findByUser(testUserId);

      expect(result).toEqual(credentials);
    });

    it("returns empty array when no credentials", async () => {
      mockSelectWhereOrderByResult(mockDb, []);

      const result = await repository.findByUser(testUserId);

      expect(result).toEqual([]);
    });
  });

  describe("upsert", () => {
    it("creates new credential", async () => {
      mockUpsertResult(mockDb, [testCredential]);

      const result = await repository.upsert(testUserId, {
        service: "igdb",
        credentialType: "twitch_oauth",
        encryptedCredentials: "encrypted-data",
      });

      expect(result).toEqual(testCredential);
    });

    it("updates existing credential on conflict", async () => {
      const updatedCredential = { ...testCredential, hasValidToken: true };
      mockUpsertResult(mockDb, [updatedCredential]);

      const result = await repository.upsert(testUserId, {
        service: "igdb",
        credentialType: "twitch_oauth",
        encryptedCredentials: "new-encrypted-data",
        hasValidToken: true,
      });

      expect(result.hasValidToken).toBe(true);
    });
  });

  describe("delete", () => {
    it("deletes credential successfully", async () => {
      mockDeleteResult(mockDb, [{ id: testCredential.id }]);

      await expect(repository.delete(testUserId, "igdb")).resolves.toBeUndefined();
    });

    it("throws NotFoundError when credential not found", async () => {
      mockDeleteResult(mockDb, []);

      await expect(repository.delete(testUserId, "igdb")).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateValidationStatus", () => {
    it("updates validation status", async () => {
      const updatedCredential = {
        ...testCredential,
        hasValidToken: true,
        lastValidatedAt: new Date(),
      };
      mockUpdateResult(mockDb, [updatedCredential]);

      const result = await repository.updateValidationStatus(testUserId, "igdb", true, null);

      expect(result?.hasValidToken).toBe(true);
    });

    it("returns null when credential not found", async () => {
      mockUpdateResult(mockDb, []);

      const result = await repository.updateValidationStatus(testUserId, "steam", true, null);

      expect(result).toBeNull();
    });
  });
});
