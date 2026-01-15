import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import "reflect-metadata";

import { inArray } from "drizzle-orm";

import { container, registerDependencies, resetContainer } from "@/container";
import { userPreferences, users } from "@/db/schema";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { createHonoApp } from "@/infrastructure/http/app";

describe("Preferences Integration Tests", () => {
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
    const username = `preftest_${Date.now()}`;
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

    if (!registerData.user?.id || !registerData.token) {
      throw new Error(`Invalid registration response: missing user id or token`);
    }

    testUserId = registerData.user.id;
    testUserToken = registerData.token;
    createdUserIds.push(testUserId);
  });

  afterAll(async () => {
    try {
      // Clean up preferences first (child)
      if (createdUserIds.length > 0) {
        await dbConnection.db
          .delete(userPreferences)
          .where(inArray(userPreferences.userId, createdUserIds))
          .execute();
      }
      // Clean up users (parent)
      if (createdUserIds.length > 0) {
        await dbConnection.db.delete(users).where(inArray(users.id, createdUserIds)).execute();
      }
    } catch (error) {
      console.error(`Error cleaning up test data:`, error instanceof Error ? error.message : error);
    }
    resetContainer();
  });

  describe("GET /api/v1/preferences", () => {
    it("should return default preferences for new user", async () => {
      const response = await app.request("/api/v1/preferences", {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        preferences: {
          default_view: string;
          items_per_page: number;
          theme: string;
          updated_at: string | null;
        };
      };

      expect(data.preferences).toBeDefined();
      expect(data.preferences.default_view).toBe("grid");
      expect(data.preferences.items_per_page).toBe(25);
      expect(data.preferences.theme).toBe("dark");
      expect(data.preferences.updated_at).toBeNull();
    });

    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/preferences");

      expect(response.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const response = await app.request("/api/v1/preferences", {
        headers: { Authorization: "Bearer invalid-token" },
      });

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /api/v1/preferences", () => {
    it("should update preferences with valid data", async () => {
      const response = await app.request("/api/v1/preferences", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          default_view: "table",
          items_per_page: 50,
          theme: "light",
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        preferences: {
          default_view: string;
          items_per_page: number;
          theme: string;
          updated_at: string | null;
        };
      };

      expect(data.preferences.default_view).toBe("table");
      expect(data.preferences.items_per_page).toBe(50);
      expect(data.preferences.theme).toBe("light");
      expect(data.preferences.updated_at).not.toBeNull();
    });

    it("should persist updated preferences", async () => {
      // First update
      const setupResponse = await app.request("/api/v1/preferences", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          theme: "auto",
        }),
      });

      expect(setupResponse.status).toBe(200);

      // Then fetch
      const getResponse = await app.request("/api/v1/preferences", {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      const data = (await getResponse.json()) as {
        preferences: { theme: string };
      };

      expect(data.preferences.theme).toBe("auto");
    });

    it("should handle partial updates", async () => {
      // First set known state
      const setupResponse = await app.request("/api/v1/preferences", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          default_view: "grid",
          items_per_page: 25,
          theme: "dark",
        }),
      });

      expect(setupResponse.status).toBe(200);

      // Update only one field
      const response = await app.request("/api/v1/preferences", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items_per_page: 100,
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        preferences: {
          default_view: string;
          items_per_page: number;
          theme: string;
        };
      };

      // Only items_per_page should change
      expect(data.preferences.default_view).toBe("grid");
      expect(data.preferences.items_per_page).toBe(100);
      expect(data.preferences.theme).toBe("dark");
    });

    it("should return 400 for invalid default_view", async () => {
      const response = await app.request("/api/v1/preferences", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          default_view: "invalid",
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid items_per_page", async () => {
      const response = await app.request("/api/v1/preferences", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items_per_page: 15,
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid theme", async () => {
      const response = await app.request("/api/v1/preferences", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          theme: "invalid",
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: "light",
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should reject unknown fields", async () => {
      const response = await app.request("/api/v1/preferences", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unknown_field: "value",
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should reject empty body", async () => {
      const response = await app.request("/api/v1/preferences", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("User isolation", () => {
    let secondUserToken: string;
    let secondUserId: string;

    beforeAll(async () => {
      // Register second user
      const username2 = `preftest2_${Date.now()}`;
      const registerResponse = await app.request("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username2,
          email: `${username2}@example.com`,
          password: "SecurePass123!",
        }),
      });

      if (!registerResponse.ok) {
        const errorBody = await registerResponse.text();
        throw new Error(
          `Failed to register second test user: ${registerResponse.status} - ${errorBody}`
        );
      }

      const registerData = (await registerResponse.json()) as {
        user: { id: string };
        token: string;
      };

      if (!registerData.user?.id || !registerData.token) {
        throw new Error(`Invalid registration response for second user: missing user id or token`);
      }

      secondUserId = registerData.user.id;
      secondUserToken = registerData.token;
      createdUserIds.push(secondUserId);
    });

    it("should not see other user preferences", async () => {
      // Set first user's preferences
      const setupResponse = await app.request("/api/v1/preferences", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          theme: "light",
          items_per_page: 100,
        }),
      });

      expect(setupResponse.status).toBe(200);

      // Second user should see defaults (their own)
      const response = await app.request("/api/v1/preferences", {
        headers: { Authorization: `Bearer ${secondUserToken}` },
      });

      const data = (await response.json()) as {
        preferences: { theme: string; items_per_page: number };
      };

      // Second user gets defaults, not first user's preferences
      expect(data.preferences.theme).toBe("dark");
      expect(data.preferences.items_per_page).toBe(25);
    });

    it("should update only own preferences", async () => {
      // Second user updates
      const setupResponse = await app.request("/api/v1/preferences", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${secondUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          default_view: "table",
        }),
      });

      expect(setupResponse.status).toBe(200);

      // First user's preferences unchanged
      const response = await app.request("/api/v1/preferences", {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      const data = (await response.json()) as {
        preferences: { default_view: string };
      };

      // First user still has their setting (from earlier test)
      expect(data.preferences.default_view).toBe("grid");
    });
  });
});
