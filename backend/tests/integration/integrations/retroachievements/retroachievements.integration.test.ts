import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import "reflect-metadata";
import { inArray } from "drizzle-orm";
import { mock } from "bun:test";
import { registerDependencies, resetContainer, container } from "@/container";
import { IGDB_SERVICE_TOKEN, RETROACHIEVEMENTS_SERVICE_TOKEN } from "@/container/tokens";
import { createHonoApp } from "@/infrastructure/http/app";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { users, userApiCredentials, games } from "@/db/schema";
import {
  createMockIgdbService,
  createMockRetroAchievementsService,
} from "@/tests/helpers/repository.mocks";
import { ENCRYPTION_SERVICE_TOKEN } from "@/container/tokens";
import type { IEncryptionService } from "@/features/credentials/services/encryption.service.interface";

describe("RetroAchievements Integration Tests", () => {
  let app: ReturnType<typeof createHonoApp>;
  let dbConnection: DatabaseConnection;
  const createdUserIds: string[] = [];
  const createdGameIds: string[] = [];
  let testUserToken = "";
  let testUserId = "";
  let testGameWithRAId = "";

  beforeAll(async () => {
    registerDependencies();

    // Override external services with mocks
    container.registerInstance(IGDB_SERVICE_TOKEN, createMockIgdbService());
    container.registerInstance(
      RETROACHIEVEMENTS_SERVICE_TOKEN,
      createMockRetroAchievementsService({
        // Mock that returns true for valid credentials
        validateCredentials: mock().mockImplementation(
          async (creds: { username: string; api_key: string }) => {
            // Simulate valid credentials for specific test values
            return creds.username === "validuser" && creds.api_key === "valid-api-key";
          }
        ),
        // Mock sync result
        syncAchievements: mock().mockResolvedValue({
          synced: 5,
          unlocked: 3,
          total: 10,
        }),
      })
    );

    app = createHonoApp();
    dbConnection = container.resolve(DatabaseConnection);

    // Create test user
    const timestamp = Date.now();
    const username1 = "ratest_" + timestamp;
    const registerResponse1 = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username1,
        email: username1 + "@example.com",
        password: "SecurePass123!",
      }),
    });

    if (!registerResponse1.ok) {
      const errorBody = await registerResponse1.text();
      throw new Error(
        "Failed to register test user: " + registerResponse1.status + " - " + errorBody
      );
    }

    const registerData1 = (await registerResponse1.json()) as {
      user: { id: string };
      token: string;
    };

    testUserId = registerData1.user.id;
    testUserToken = registerData1.token;
    createdUserIds.push(testUserId);

    // Create IGDB credentials for test user (required for some game operations)
    const encryptionService = container.resolve<IEncryptionService>(ENCRYPTION_SERVICE_TOKEN);
    const credentialData = { client_id: "test", client_secret: "test" };
    const encryptedCreds = encryptionService.encrypt(credentialData);

    await dbConnection.db
      .insert(userApiCredentials)
      .values({
        userId: testUserId,
        service: "igdb",
        credentialType: "twitch_oauth",
        encryptedCredentials: encryptedCreds,
        isActive: true,
        hasValidToken: true,
        tokenExpiresAt: new Date(Date.now() + 3600000),
        lastValidatedAt: new Date(),
      })
      .execute();

    // Create test game with retro_game_id
    const [gameWithRAResult] = await dbConnection.db
      .insert(games)
      .values({
        name: "Test Game With RA",
        slug: "test-game-ra-" + timestamp,
        retroGameId: 12345,
        metadataSource: "manual",
      })
      .returning()
      .execute();

    testGameWithRAId = gameWithRAResult.id;
    createdGameIds.push(testGameWithRAId);
  });

  afterAll(async () => {
    try {
      // Clean up games
      if (createdGameIds.length > 0) {
        await dbConnection.db.delete(games).where(inArray(games.id, createdGameIds)).execute();
      }

      // Clean up user credentials
      if (createdUserIds.length > 0) {
        await dbConnection.db
          .delete(userApiCredentials)
          .where(inArray(userApiCredentials.userId, createdUserIds))
          .execute();
      }

      // Clean up users
      if (createdUserIds.length > 0) {
        await dbConnection.db.delete(users).where(inArray(users.id, createdUserIds)).execute();
      }
    } catch (error) {
      console.error("Error cleaning up test data:", error instanceof Error ? error.message : error);
    }
    resetContainer();
  });

  describe("POST /api/v1/retroachievements/credentials", () => {
    it("should save valid credentials and return 201", async () => {
      const response = await app.request("/api/v1/retroachievements/credentials", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + testUserToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "validuser",
          api_key: "valid-api-key",
        }),
      });

      expect(response.status).toBe(201);

      const data = (await response.json()) as {
        is_valid: boolean;
        message: string;
      };

      expect(data.is_valid).toBe(true);
      expect(data.message).toContain("saved");
    });

    it("should return 400 for invalid credentials", async () => {
      const response = await app.request("/api/v1/retroachievements/credentials", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + testUserToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "invaliduser",
          api_key: "wrong-key",
        }),
      });

      expect(response.status).toBe(400);

      const data = (await response.json()) as { error: string; code: string };
      expect(data.error).toContain("Invalid");
      expect(data.code).toBe("INVALID_CREDENTIALS");
    });

    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/retroachievements/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "validuser",
          api_key: "valid-api-key",
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 400 for missing required fields", async () => {
      const response = await app.request("/api/v1/retroachievements/credentials", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + testUserToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "validuser",
          // Missing api_key
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/retroachievements/validate", () => {
    it("should return is_valid true for valid credentials", async () => {
      const response = await app.request("/api/v1/retroachievements/validate", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + testUserToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "validuser",
          api_key: "valid-api-key",
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        is_valid: boolean;
        message: string;
      };

      expect(data.is_valid).toBe(true);
    });

    it("should return is_valid false for invalid credentials", async () => {
      const response = await app.request("/api/v1/retroachievements/validate", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + testUserToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "invaliduser",
          api_key: "wrong-key",
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        is_valid: boolean;
        message: string;
      };

      expect(data.is_valid).toBe(false);
    });

    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/retroachievements/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "validuser",
          api_key: "valid-api-key",
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/retroachievements/sync", () => {
    beforeAll(async () => {
      // Ensure RA credentials exist for sync test
      const encryptionService = container.resolve<IEncryptionService>(ENCRYPTION_SERVICE_TOKEN);
      const raCredentialData = { username: "validuser", api_key: "valid-api-key" };
      const encryptedRACreds = encryptionService.encrypt(raCredentialData);

      await dbConnection.db
        .insert(userApiCredentials)
        .values({
          userId: testUserId,
          service: "retroachievements",
          credentialType: "api_key",
          encryptedCredentials: encryptedRACreds,
          isActive: true,
          hasValidToken: true,
          lastValidatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [userApiCredentials.userId, userApiCredentials.service],
          set: {
            encryptedCredentials: encryptedRACreds,
            isActive: true,
            hasValidToken: true,
            lastValidatedAt: new Date(),
          },
        })
        .execute();
    });

    it("should sync achievements successfully", async () => {
      const response = await app.request("/api/v1/retroachievements/sync", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + testUserToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game_id: testGameWithRAId,
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        synced: number;
        unlocked: number;
        total: number;
      };

      expect(data.synced).toBe(5);
      expect(data.unlocked).toBe(3);
      expect(data.total).toBe(10);
    });

    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/retroachievements/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: testGameWithRAId,
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid game_id format", async () => {
      const response = await app.request("/api/v1/retroachievements/sync", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + testUserToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game_id: "invalid-uuid",
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});
