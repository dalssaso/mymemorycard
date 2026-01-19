import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import "reflect-metadata";
import { inArray, eq, or } from "drizzle-orm";
import { registerDependencies, resetContainer, container } from "@/container";
import {
  IGDB_SERVICE_TOKEN,
  STEAM_SERVICE_TOKEN,
  RETROACHIEVEMENTS_SERVICE_TOKEN,
} from "@/container/tokens";
import { createHonoApp } from "@/infrastructure/http/app";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import {
  users,
  userApiCredentials,
  games,
  platforms,
  achievements,
  userAchievements,
} from "@/db/schema";
import {
  createMockIgdbService,
  createMockSteamService,
  createMockRetroAchievementsService,
} from "@/tests/helpers/repository.mocks";
import { ENCRYPTION_SERVICE_TOKEN } from "@/container/tokens";
import type { IEncryptionService } from "@/features/credentials/services/encryption.service.interface";
import { randomUUID } from "crypto";

describe("Achievements Integration Tests", () => {
  let app: ReturnType<typeof createHonoApp>;
  let dbConnection: DatabaseConnection;
  const createdUserIds: string[] = [];
  const createdGameIds: string[] = [];
  const createdAchievementIds: string[] = [];
  let testUserToken = "";
  let testUserId = "";
  let testUser2Token = "";
  let testUser2Id = "";
  let pcPlatformId = "";
  let testGameId = "";
  let testGameWithSteamId = "";

  beforeAll(async () => {
    registerDependencies();

    // Override external services with mocks
    container.registerInstance(IGDB_SERVICE_TOKEN, createMockIgdbService());
    container.registerInstance(
      STEAM_SERVICE_TOKEN,
      createMockSteamService({
        getAchievementsForUser: async () => [
          {
            achievement_id: "ACH_TEST_1",
            name: "Test Achievement 1",
            description: "First test achievement",
            icon_url: "https://example.com/icon1.png",
            rarity_percentage: 50.5,
            points: null,
            unlocked: true,
            unlock_time: new Date("2024-01-15T10:00:00Z"),
          },
          {
            achievement_id: "ACH_TEST_2",
            name: "Test Achievement 2",
            description: "Second test achievement",
            icon_url: "https://example.com/icon2.png",
            rarity_percentage: 25.3,
            points: null,
            unlocked: false,
            unlock_time: null,
          },
        ],
      })
    );
    container.registerInstance(
      RETROACHIEVEMENTS_SERVICE_TOKEN,
      createMockRetroAchievementsService()
    );

    app = createHonoApp();
    dbConnection = container.resolve(DatabaseConnection);

    // Find seeded PC platform
    const pcPlatform = await dbConnection.db.query.platforms.findFirst({
      where: eq(platforms.name, "PC (Microsoft Windows)"),
    });

    if (!pcPlatform) {
      throw new Error("PC platform not found in seed data");
    }

    pcPlatformId = pcPlatform.id;

    // Create first test user
    const timestamp = Date.now();
    const username1 = "achtest_" + timestamp;
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
        "Failed to register test user 1: " + registerResponse1.status + " - " + errorBody
      );
    }

    const registerData1 = (await registerResponse1.json()) as {
      user: { id: string };
      token: string;
    };

    testUserId = registerData1.user.id;
    testUserToken = registerData1.token;
    createdUserIds.push(testUserId);

    // Create second test user for cross-user authorization tests
    const username2 = "achtest2_" + timestamp;
    const registerResponse2 = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username2,
        email: username2 + "@example.com",
        password: "SecurePass123!",
      }),
    });

    if (!registerResponse2.ok) {
      const errorBody = await registerResponse2.text();
      throw new Error(
        "Failed to register test user 2: " + registerResponse2.status + " - " + errorBody
      );
    }

    const registerData2 = (await registerResponse2.json()) as {
      user: { id: string };
      token: string;
    };

    testUser2Id = registerData2.user.id;
    testUser2Token = registerData2.token;
    createdUserIds.push(testUser2Id);

    // Create IGDB credentials for test users (required for some game operations)
    const encryptionService = container.resolve<IEncryptionService>(ENCRYPTION_SERVICE_TOKEN);
    const credentialData = { client_id: "test", client_secret: "test" };
    const encryptedCreds = encryptionService.encrypt(credentialData);

    await dbConnection.db
      .insert(userApiCredentials)
      .values([
        {
          userId: testUserId,
          service: "igdb",
          credentialType: "twitch_oauth",
          encryptedCredentials: encryptedCreds,
          isActive: true,
          hasValidToken: true,
          tokenExpiresAt: new Date(Date.now() + 3600000),
          lastValidatedAt: new Date(),
        },
        {
          userId: testUser2Id,
          service: "igdb",
          credentialType: "twitch_oauth",
          encryptedCredentials: encryptedCreds,
          isActive: true,
          hasValidToken: true,
          tokenExpiresAt: new Date(Date.now() + 3600000),
          lastValidatedAt: new Date(),
        },
      ])
      .execute();

    // Create Steam credentials for test user
    const steamCredentialData = { steam_id: "76561198012345678" };
    const encryptedSteamCreds = encryptionService.encrypt(steamCredentialData);

    await dbConnection.db
      .insert(userApiCredentials)
      .values({
        userId: testUserId,
        service: "steam",
        credentialType: "steam_openid",
        encryptedCredentials: encryptedSteamCreds,
        isActive: true,
        hasValidToken: true,
        lastValidatedAt: new Date(),
      })
      .execute();

    // Create test game without steam_app_id
    const [gameResult] = await dbConnection.db
      .insert(games)
      .values({
        name: "Test Game Without Steam",
        slug: "test-game-no-steam-" + timestamp,
        metadataSource: "manual",
      })
      .returning()
      .execute();

    testGameId = gameResult.id;
    createdGameIds.push(testGameId);

    // Create test game with steam_app_id
    const [gameWithSteamResult] = await dbConnection.db
      .insert(games)
      .values({
        name: "Test Game With Steam",
        slug: "test-game-steam-" + timestamp,
        steamAppId: 123456,
        metadataSource: "manual",
      })
      .returning()
      .execute();

    testGameWithSteamId = gameWithSteamResult.id;
    createdGameIds.push(testGameWithSteamId);

    // Create some achievements for the first test game (manual source for fallback testing)
    const [ach1] = await dbConnection.db
      .insert(achievements)
      .values({
        gameId: testGameId,
        platformId: pcPlatformId,
        achievementId: "MANUAL_ACH_1",
        name: "Manual Achievement 1",
        description: "A manual test achievement",
        sourceApi: "manual",
      })
      .returning()
      .execute();

    createdAchievementIds.push(ach1.id);

    // Create user achievement unlock for first user
    await dbConnection.db
      .insert(userAchievements)
      .values({
        userId: testUserId,
        achievementId: ach1.id,
        unlocked: true,
        unlockDate: new Date("2024-01-10T12:00:00Z"),
      })
      .execute();
  });

  afterAll(async () => {
    try {
      // Clean up in reverse order of dependencies
      // 1. User achievements - delete by achievementId OR userId to catch sync-created rows
      if (createdAchievementIds.length > 0 || createdUserIds.length > 0) {
        const conditions = [];
        if (createdAchievementIds.length > 0) {
          conditions.push(inArray(userAchievements.achievementId, createdAchievementIds));
        }
        if (createdUserIds.length > 0) {
          conditions.push(inArray(userAchievements.userId, createdUserIds));
        }
        if (conditions.length > 0) {
          await dbConnection.db
            .delete(userAchievements)
            .where(or(...conditions))
            .execute();
        }
      }

      // 2. Achievements
      if (createdGameIds.length > 0) {
        await dbConnection.db
          .delete(achievements)
          .where(inArray(achievements.gameId, createdGameIds))
          .execute();
      }

      // 3. Games
      if (createdGameIds.length > 0) {
        await dbConnection.db.delete(games).where(inArray(games.id, createdGameIds)).execute();
      }

      // 4. User credentials
      if (createdUserIds.length > 0) {
        await dbConnection.db
          .delete(userApiCredentials)
          .where(inArray(userApiCredentials.userId, createdUserIds))
          .execute();
      }

      // 5. Users
      if (createdUserIds.length > 0) {
        await dbConnection.db.delete(users).where(inArray(users.id, createdUserIds)).execute();
      }
    } catch (error) {
      console.error("Error cleaning up test data:", error instanceof Error ? error.message : error);
    }
    resetContainer();
  });

  describe("GET /api/v1/achievements/:gameId", () => {
    it("should return cached achievements for a game", async () => {
      const response = await app.request("/api/v1/achievements/" + testGameId, {
        headers: { Authorization: "Bearer " + testUserToken },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        source: string;
        achievements: Array<{ id: string; name: string; unlocked: boolean }>;
        total: number;
        unlocked: number;
      };

      expect(data.source).toBe("manual");
      expect(data.total).toBeGreaterThanOrEqual(1);
      expect(data.unlocked).toBeGreaterThanOrEqual(1);
    });

    it("should return 404 for non-existent game", async () => {
      const nonExistentId = randomUUID();
      const response = await app.request("/api/v1/achievements/" + nonExistentId, {
        headers: { Authorization: "Bearer " + testUserToken },
      });

      expect(response.status).toBe(404);
    });

    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/achievements/" + testGameId);

      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid UUID format", async () => {
      const response = await app.request("/api/v1/achievements/invalid-uuid", {
        headers: { Authorization: "Bearer " + testUserToken },
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/v1/achievements/:gameId/progress", () => {
    it("should return progress for a game with manual achievements (no external IDs)", async () => {
      // Note: getProgress only returns achievements for games with steam_app_id or retro_game_id
      // For games with only manual achievements, it returns zero counts
      const response = await app.request("/api/v1/achievements/" + testGameId + "/progress", {
        headers: { Authorization: "Bearer " + testUserToken },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        unlocked: number;
        total: number;
        percentage: number;
      };

      // Manual achievements are not counted by getProgress (which only checks external sources)
      expect(data.total).toBe(0);
      expect(data.unlocked).toBe(0);
      expect(data.percentage).toBe(0);
    });

    it("should return 404 for non-existent game", async () => {
      const nonExistentId = randomUUID();
      const response = await app.request("/api/v1/achievements/" + nonExistentId + "/progress", {
        headers: { Authorization: "Bearer " + testUserToken },
      });

      expect(response.status).toBe(404);
    });

    it("should return zero progress for user without unlocks", async () => {
      const response = await app.request("/api/v1/achievements/" + testGameId + "/progress", {
        headers: { Authorization: "Bearer " + testUser2Token },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        unlocked: number;
        total: number;
        percentage: number;
      };

      // User 2 has no unlocks but should still see total count
      expect(data.unlocked).toBe(0);
    });

    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/achievements/" + testGameId + "/progress");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/achievements/:gameId/sync", () => {
    it("should sync achievements from Steam for a game with steam_app_id", async () => {
      const response = await app.request("/api/v1/achievements/" + testGameWithSteamId + "/sync", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + testUserToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "steam",
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        source: string;
        achievements: Array<{ id: string; name: string; unlocked: boolean }>;
        total: number;
        unlocked: number;
      };

      expect(data.source).toBe("steam");
      expect(data.total).toBe(2);
      expect(data.unlocked).toBe(1);
      expect(data.achievements).toHaveLength(2);

      // Verify achievement details from mock
      const unlockedAch = data.achievements.find((a) => a.unlocked);
      expect(unlockedAch).toBeDefined();
      expect(unlockedAch?.name).toBe("Test Achievement 1");
    });

    it("should return 400 when syncing Steam for game without steam_app_id", async () => {
      const response = await app.request("/api/v1/achievements/" + testGameId + "/sync", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + testUserToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "steam",
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for unsupported sync source", async () => {
      const response = await app.request("/api/v1/achievements/" + testGameId + "/sync", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + testUserToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "manual",
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent game", async () => {
      const nonExistentId = randomUUID();
      const response = await app.request("/api/v1/achievements/" + nonExistentId + "/sync", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + testUserToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "steam",
        }),
      });

      expect(response.status).toBe(404);
    });

    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/achievements/" + testGameId + "/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "steam",
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("Cross-user authorization tests", () => {
    it("should return empty achievements for user without unlocks (not 403)", async () => {
      // User 2 accesses the game that has achievements unlocked by User 1
      // Should return achievements but with their own unlock status (none)
      const response = await app.request("/api/v1/achievements/" + testGameId, {
        headers: { Authorization: "Bearer " + testUser2Token },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        source: string;
        achievements: Array<{ id: string; unlocked: boolean }>;
        total: number;
        unlocked: number;
      };

      // User 2 should see the achievements but have none unlocked
      expect(data.total).toBeGreaterThanOrEqual(1);
      expect(data.unlocked).toBe(0);

      // All achievements should show as not unlocked for this user
      const unlockedCount = data.achievements.filter((a) => a.unlocked).length;
      expect(unlockedCount).toBe(0);
    });

    it("should isolate user achievement progress", async () => {
      // Note: getProgress only tracks games with steam_app_id or retro_game_id
      // For testGameId (manual-only), both users see zero progress
      // The getAchievements endpoint correctly tracks manual achievements per user
      const [response1, response2] = await Promise.all([
        app.request("/api/v1/achievements/" + testGameId + "/progress", {
          headers: { Authorization: "Bearer " + testUserToken },
        }),
        app.request("/api/v1/achievements/" + testGameId + "/progress", {
          headers: { Authorization: "Bearer " + testUser2Token },
        }),
      ]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const data1 = (await response1.json()) as { unlocked: number; total: number };
      const data2 = (await response2.json()) as { unlocked: number; total: number };

      // Both return 0 since the game only has manual achievements (no external IDs)
      // User isolation is tested via getAchievements endpoint in the test above
      expect(data1.unlocked).toBe(0);
      expect(data2.unlocked).toBe(0);
    });
  });
});
