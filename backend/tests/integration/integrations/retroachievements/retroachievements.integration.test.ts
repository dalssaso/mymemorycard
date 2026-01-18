import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import "reflect-metadata";
import { inArray } from "drizzle-orm";
import { registerDependencies, resetContainer, container } from "@/container";
import { createHonoApp } from "@/infrastructure/http/app";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { users, userApiCredentials } from "@/db/schema";

describe("RetroAchievements Integration Tests", () => {
  let app: ReturnType<typeof createHonoApp>;
  let dbConnection: DatabaseConnection;
  const createdUserIds: string[] = [];
  let testUserToken: string;
  let testUserId: string;

  beforeAll(async () => {
    registerDependencies();
    app = createHonoApp();
    dbConnection = container.resolve(DatabaseConnection);

    // Create test user and get token
    const username = `ratest_${Date.now()}`;
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
      // Clean up credentials first (foreign key constraint)
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

  describe("POST /api/v1/retroachievements/credentials", () => {
    it("should return 401 without authentication", async () => {
      const response = await app.request("/api/v1/retroachievements/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          api_key: "testapikey",
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should return is_valid false for invalid credentials", async () => {
      const response = await app.request("/api/v1/retroachievements/credentials", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "invaliduser",
          api_key: "invalidkey",
        }),
      });

      // Returns 201 with is_valid: false for invalid credentials
      expect(response.status).toBe(201);

      const data = (await response.json()) as { is_valid: boolean; message: string };
      expect(data.is_valid).toBe(false);
    });

    it("should return 400 for missing username", async () => {
      const response = await app.request("/api/v1/retroachievements/credentials", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: "testapikey",
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for missing api_key", async () => {
      const response = await app.request("/api/v1/retroachievements/credentials", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "testuser",
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/retroachievements/validate", () => {
    it("should return 401 without authentication", async () => {
      const response = await app.request("/api/v1/retroachievements/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          api_key: "testapikey",
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should validate credentials without saving", async () => {
      const response = await app.request("/api/v1/retroachievements/validate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "invaliduser",
          api_key: "invalidkey",
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as { is_valid: boolean; message: string };
      expect(data.is_valid).toBe(false);
      expect(data.message).toContain("Invalid");
    });
  });

  describe("POST /api/v1/retroachievements/sync", () => {
    it("should return 401 without authentication", async () => {
      const response = await app.request("/api/v1/retroachievements/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: "550e8400-e29b-41d4-a716-446655440000" }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 400 for invalid game ID format", async () => {
      const response = await app.request("/api/v1/retroachievements/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ game_id: "invalid-uuid" }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for missing game_id", async () => {
      const response = await app.request("/api/v1/retroachievements/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });
});
