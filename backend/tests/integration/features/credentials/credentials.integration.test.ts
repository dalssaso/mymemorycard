import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import "reflect-metadata";
import { inArray } from "drizzle-orm";
import { registerDependencies, resetContainer, container } from "@/container";
import { createHonoApp } from "@/infrastructure/http/app";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { users, userApiCredentials } from "@/db/schema";

describe("Credentials Integration Tests", () => {
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
    const username = `credtest_${Date.now()}`;
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

  describe("GET /api/v1/credentials", () => {
    it("should return empty list for new user", async () => {
      const response = await app.request("/api/v1/credentials", {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as { services: unknown[] };
      expect(Array.isArray(data.services)).toBe(true);
      expect(data.services).toHaveLength(0);
    });

    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/credentials");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/credentials", () => {
    it("should save IGDB credentials", async () => {
      const response = await app.request("/api/v1/credentials", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: "igdb",
          credential_type: "twitch_oauth",
          credentials: {
            client_id: "test-client-id",
            client_secret: "test-client-secret",
          },
        }),
      });

      expect(response.status).toBe(201);

      const data = (await response.json()) as {
        service: string;
        credential_type: string;
        is_active: boolean;
        message: string;
      };
      expect(data.service).toBe("igdb");
      expect(data.credential_type).toBe("twitch_oauth");
      expect(data.is_active).toBe(true);
    });

    it("should return 400 for invalid credential type", async () => {
      const response = await app.request("/api/v1/credentials", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: "igdb",
          credential_type: "api_key",
          credentials: { api_key: "test" },
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: "igdb",
          credential_type: "twitch_oauth",
          credentials: { client_id: "test", client_secret: "test" },
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/credentials/validate", () => {
    beforeAll(async () => {
      // Ensure credentials exist for validation test
      await app.request("/api/v1/credentials", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: "igdb",
          credential_type: "twitch_oauth",
          credentials: {
            client_id: "test-client-id",
            client_secret: "test-client-secret",
          },
        }),
      });
    });

    it("should validate stored credentials", async () => {
      const response = await app.request("/api/v1/credentials/validate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ service: "igdb" }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        service: string;
        valid: boolean;
        has_valid_token: boolean;
        message: string;
      };
      expect(data.service).toBe("igdb");
      expect(data.valid).toBe(true);
    });

    it("should return 404 for non-existent credentials", async () => {
      const response = await app.request("/api/v1/credentials/validate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ service: "steam" }),
      });

      expect(response.status).toBe(404);
    });

    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/credentials/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: "igdb" }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/v1/credentials/:service", () => {
    beforeAll(async () => {
      // Ensure credentials exist for deletion test
      await app.request("/api/v1/credentials", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: "rawg",
          credential_type: "api_key",
          credentials: { api_key: "test-api-key" },
        }),
      });
    });

    it("should delete credentials", async () => {
      const response = await app.request("/api/v1/credentials/rawg", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(204);

      // Verify deletion
      const listResponse = await app.request("/api/v1/credentials", {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      const data = (await listResponse.json()) as {
        services: Array<{ service: string }>;
      };
      const found = data.services.find((s) => s.service === "rawg");
      expect(found).toBeUndefined();
    });

    it("should return 404 for non-existent credentials", async () => {
      const response = await app.request("/api/v1/credentials/steam", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(404);
    });

    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/credentials/igdb", {
        method: "DELETE",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("Cross-user authorization tests", () => {
    let secondUserId = "";
    let secondUserToken = "";

    beforeAll(async () => {
      // Register second user
      const username2 = `credtest2_${Date.now()}`;
      const registerResponse = await app.request("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username2,
          email: `${username2}@example.com`,
          password: "SecurePass123!",
        }),
      });

      if (!registerResponse.ok) return;

      const registerData = (await registerResponse.json()) as {
        user: { id: string };
        token: string;
      };
      secondUserId = registerData.user.id;
      secondUserToken = registerData.token;
      createdUserIds.push(secondUserId);

      // Create credentials for second user
      await app.request("/api/v1/credentials", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secondUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: "retroachievements",
          credential_type: "api_key",
          credentials: { username: "test", api_key: "test-key" },
        }),
      });
    });

    it("should not allow validating another user credentials (returns 404)", async () => {
      // First user tries to validate second user's credentials
      // Since credentials are scoped to user, this should return 404
      const response = await app.request("/api/v1/credentials/validate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ service: "retroachievements" }),
      });

      expect(response.status).toBe(404);
    });

    it("should not allow deleting another user credentials (returns 404)", async () => {
      const response = await app.request("/api/v1/credentials/retroachievements", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(404);
    });

    it("user lists should be isolated", async () => {
      // First user should not see second user's credentials
      const response = await app.request("/api/v1/credentials", {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      const data = (await response.json()) as {
        services: Array<{ service: string }>;
      };
      const found = data.services.find((s) => s.service === "retroachievements");
      expect(found).toBeUndefined();
    });
  });
});
