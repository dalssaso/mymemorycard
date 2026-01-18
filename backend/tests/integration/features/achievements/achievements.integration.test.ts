import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import "reflect-metadata";
import { inArray } from "drizzle-orm";
import { registerDependencies, resetContainer, container } from "@/container";
import { createHonoApp } from "@/infrastructure/http/app";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { users, games, userGames, achievements, userAchievements } from "@/db/schema";

describe("Achievements Integration Tests", () => {
  let app: ReturnType<typeof createHonoApp>;
  let dbConnection: DatabaseConnection;
  const createdUserIds: string[] = [];
  const createdGameIds: string[] = [];
  let testUserToken: string;
  let testGameId: string;

  beforeAll(async () => {
    registerDependencies();
    app = createHonoApp();
    dbConnection = container.resolve(DatabaseConnection);

    // Create test user and get token
    const username = `achtest_${Date.now()}`;
    const registerResponse = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email: `${username}@example.com`,
        password: "SecurePass123!",
      }),
    });

    if (!registerResponse.ok) {
      const errorBody = await registerResponse.text();
      throw new Error(`Failed to register test user: ${registerResponse.status} - ${errorBody}`);
    }

    const registerData = (await registerResponse.json()) as {
      user: { id: string };
      token: string;
    };

    const testUserId = registerData.user.id;
    testUserToken = registerData.token;
    createdUserIds.push(testUserId);

    // Create a test game for achievement tests
    const [testGame] = await dbConnection.db
      .insert(games)
      .values({
        name: `Test Game ${Date.now()}`,
        slug: `test-game-${Date.now()}`,
        metadataSource: "igdb",
        steamAppId: 570, // Dota 2 - a real Steam app ID
      })
      .returning();

    testGameId = testGame.id;
    createdGameIds.push(testGameId);
  });

  afterAll(async () => {
    try {
      // Clean up achievements (in order due to foreign keys)
      if (createdGameIds.length > 0) {
        const gameAchievements = await dbConnection.db
          .select({ id: achievements.id })
          .from(achievements)
          .where(inArray(achievements.gameId, createdGameIds));

        if (gameAchievements.length > 0) {
          const achievementIds = gameAchievements.map((a) => a.id);
          await dbConnection.db
            .delete(userAchievements)
            .where(inArray(userAchievements.achievementId, achievementIds))
            .execute();
          await dbConnection.db
            .delete(achievements)
            .where(inArray(achievements.id, achievementIds))
            .execute();
        }
      }
      // Clean up user games
      if (createdGameIds.length > 0) {
        await dbConnection.db
          .delete(userGames)
          .where(inArray(userGames.gameId, createdGameIds))
          .execute();
      }
      // Clean up games
      if (createdGameIds.length > 0) {
        await dbConnection.db.delete(games).where(inArray(games.id, createdGameIds)).execute();
      }
      // Clean up test users
      if (createdUserIds.length > 0) {
        await dbConnection.db.delete(users).where(inArray(users.id, createdUserIds)).execute();
      }
    } catch (error) {
      console.error(`Error cleaning up test data:`, error instanceof Error ? error.message : error);
    }
    resetContainer();
  });

  describe("GET /api/v1/achievements/:gameId", () => {
    it("should return 401 without authentication", async () => {
      const response = await app.request(`/api/v1/achievements/${testGameId}`);

      expect(response.status).toBe(401);
    });

    it("should return achievements for a game", async () => {
      const response = await app.request(`/api/v1/achievements/${testGameId}`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        source: string;
        achievements: unknown[];
        total: number;
        unlocked: number;
      };
      expect(data.source).toBeDefined();
      expect(Array.isArray(data.achievements)).toBe(true);
      expect(typeof data.total).toBe("number");
      expect(typeof data.unlocked).toBe("number");
    });

    it("should return 400 for invalid game ID format", async () => {
      const response = await app.request(`/api/v1/achievements/invalid-uuid`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent game", async () => {
      const response = await app.request(
        `/api/v1/achievements/550e8400-e29b-41d4-a716-446655440000`,
        {
          headers: { Authorization: `Bearer ${testUserToken}` },
        }
      );

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/v1/achievements/:gameId/progress", () => {
    it("should return 401 without authentication", async () => {
      const response = await app.request(`/api/v1/achievements/${testGameId}/progress`);

      expect(response.status).toBe(401);
    });

    it("should return progress for a game", async () => {
      const response = await app.request(`/api/v1/achievements/${testGameId}/progress`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        unlocked: number;
        total: number;
        percentage: number;
      };
      expect(typeof data.unlocked).toBe("number");
      expect(typeof data.total).toBe("number");
      expect(typeof data.percentage).toBe("number");
      expect(data.percentage).toBeGreaterThanOrEqual(0);
      expect(data.percentage).toBeLessThanOrEqual(100);
    });

    it("should return 400 for invalid game ID format", async () => {
      const response = await app.request(`/api/v1/achievements/invalid-uuid/progress`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/achievements/:gameId/sync", () => {
    it("should return 401 without authentication", async () => {
      const response = await app.request(`/api/v1/achievements/${testGameId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: testGameId, source: "steam" }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid game ID format", async () => {
      const response = await app.request(`/api/v1/achievements/invalid-uuid/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ game_id: "invalid-uuid", source: "steam" }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid source", async () => {
      const response = await app.request(`/api/v1/achievements/${testGameId}/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ game_id: testGameId, source: "invalid-source" }),
      });

      expect(response.status).toBe(400);
    });
  });
});
