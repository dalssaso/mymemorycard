import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import "reflect-metadata";
import { inArray } from "drizzle-orm";
import { registerDependencies, resetContainer, container } from "@/container";
import { createHonoApp } from "@/infrastructure/http/app";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { users, userApiCredentials, games, userGames } from "@/db/schema";

describe("Steam Integration Tests", () => {
  let app: ReturnType<typeof createHonoApp>;
  let dbConnection: DatabaseConnection;
  const createdUserIds: string[] = [];
  const createdGameIds: string[] = [];
  let testUserToken: string;
  let testUserId: string;

  beforeAll(async () => {
    registerDependencies();
    app = createHonoApp();
    dbConnection = container.resolve(DatabaseConnection);

    // Create test user and get token
    const username = `steamtest_${Date.now()}`;
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

    testUserId = registerData.user.id;
    testUserToken = registerData.token;
    createdUserIds.push(testUserId);
  });

  afterAll(async () => {
    try {
      // Clean up user games first (foreign key constraint)
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
      // Clean up credentials
      if (createdUserIds.length > 0) {
        await dbConnection.db
          .delete(userApiCredentials)
          .where(inArray(userApiCredentials.userId, createdUserIds))
          .execute();
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

  describe("GET /api/v1/steam/connect", () => {
    it("should return 401 without authentication", async () => {
      const response = await app.request("/api/v1/steam/connect");

      expect(response.status).toBe(401);
    });

    it("should return redirect URL for authenticated user", async () => {
      const response = await app.request("/api/v1/steam/connect", {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as { redirect_url: string };
      expect(data.redirect_url).toBeDefined();
      expect(data.redirect_url).toContain("steamcommunity.com/openid");
    });
  });

  describe("GET /api/v1/steam/callback", () => {
    it("should return 401 without authentication", async () => {
      const response = await app.request("/api/v1/steam/callback?openid.claimed_id=test");

      expect(response.status).toBe(401);
    });

    it("should return failed status for invalid OpenID callback", async () => {
      const response = await app.request("/api/v1/steam/callback?openid.claimed_id=test", {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as { status: string };
      expect(data.status).toBe("failed");
    });
  });

  describe("POST /api/v1/steam/library", () => {
    it("should return 401 without authentication", async () => {
      const response = await app.request("/api/v1/steam/library", {
        method: "POST",
      });

      expect(response.status).toBe(401);
    });

    it("should return 404 when Steam account not linked", async () => {
      const response = await app.request("/api/v1/steam/library", {
        method: "POST",
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      // Returns 404 because Steam credentials are not found for the user
      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/v1/steam/sync", () => {
    it("should return 401 without authentication", async () => {
      const response = await app.request("/api/v1/steam/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: "550e8400-e29b-41d4-a716-446655440000" }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid game ID format", async () => {
      const response = await app.request("/api/v1/steam/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ game_id: "invalid-uuid" }),
      });

      expect(response.status).toBe(400);
    });
  });
});
