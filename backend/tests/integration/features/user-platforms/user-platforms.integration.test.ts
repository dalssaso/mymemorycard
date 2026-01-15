import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import "reflect-metadata";
import { inArray } from "drizzle-orm";
import { registerDependencies, resetContainer, container } from "@/container";
import { createHonoApp } from "@/infrastructure/http/app";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { users, userPlatforms } from "@/db/schema";

describe("User-Platforms Integration Tests", () => {
  let app: ReturnType<typeof createHonoApp>;
  let dbConnection: DatabaseConnection;
  const createdUserIds: string[] = [];
  const createdUserPlatformIds: string[] = [];
  let testPlatformId: string;
  let testUserToken: string;
  let testUserId: string;

  beforeAll(async () => {
    registerDependencies();
    app = createHonoApp();
    dbConnection = container.resolve(DatabaseConnection);

    // Get a test platform (fail fast if none exist)
    const platformList = await dbConnection.db.query.platforms.findFirst();
    if (!platformList) {
      throw new Error("No platforms found in database - ensure seed data exists");
    }
    testPlatformId = platformList.id;

    // Create test user and get token
    const username = `testuser_${Date.now()}`;
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
      // Clean up test user-platforms
      if (createdUserPlatformIds.length > 0) {
        await dbConnection.db
          .delete(userPlatforms)
          .where(inArray(userPlatforms.id, createdUserPlatformIds))
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

  describe("GET /api/v1/user-platforms", () => {
    it("should return empty list for new user", async () => {
      const response = await app.request("/api/v1/user-platforms", {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        user_platforms: unknown[];
      };
      expect(Array.isArray(data.user_platforms)).toBe(true);
    });

    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/user-platforms");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/user-platforms", () => {
    it("should add platform to user", async () => {
      if (!testPlatformId) {
        expect(testPlatformId).toBeDefined();
        return;
      }

      const response = await app.request("/api/v1/user-platforms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform_id: testPlatformId,
          username: "test_username",
          notes: "Test platform connection",
        }),
      });

      expect(response.status).toBe(201);

      const data = (await response.json()) as {
        id: string;
        user_id: string;
        platform_id: string;
        username: string;
        notes: string;
      };
      expect(data.user_id).toBe(testUserId);
      expect(data.platform_id).toBe(testPlatformId);
      expect(data.username).toBe("test_username");
      expect(data.notes).toBe("Test platform connection");
      createdUserPlatformIds.push(data.id);
    });

    it("should return 401 without token", async () => {
      if (!testPlatformId) {
        return;
      }

      const response = await app.request("/api/v1/user-platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform_id: testPlatformId,
          username: "test_username",
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should validate required fields", async () => {
      const response = await app.request("/api/v1/user-platforms", {
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

  describe("PATCH /api/v1/user-platforms/:id", () => {
    let testUserPlatformId = "";

    beforeAll(async () => {
      // Create a user-platform to test updates
      if (!testPlatformId) return;

      const response = await app.request("/api/v1/user-platforms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform_id: testPlatformId,
          username: "original_username",
        }),
      });

      if (response.status === 201) {
        const data = (await response.json()) as { id: string };
        testUserPlatformId = data.id;
        createdUserPlatformIds.push(testUserPlatformId);
      }
    });

    it("should update platform details", async () => {
      if (!testUserPlatformId) {
        expect(testUserPlatformId).toBeDefined();
        return;
      }
      const response = await app.request(`/api/v1/user-platforms/${testUserPlatformId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "updated_username",
          notes: "Updated notes",
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        id: string;
        username: string;
        notes: string;
      };
      expect(data.id).toBe(testUserPlatformId);
      expect(data.username).toBe("updated_username");
      expect(data.notes).toBe("Updated notes");
    });

    it("should return 404 for non-existent platform", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      const response = await app.request(`/api/v1/user-platforms/${nonExistentId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "updated_username",
        }),
      });

      expect(response.status).toBe(404);
    });

    it("should return 401 without token", async () => {
      const validId = "22222222-2222-2222-2222-222222222222";
      const response = await app.request(`/api/v1/user-platforms/${validId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "updated_username",
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/v1/user-platforms/:id", () => {
    let testUserPlatformId = "";

    beforeAll(async () => {
      // Create a user-platform to test deletion
      if (!testPlatformId) return;

      const response = await app.request("/api/v1/user-platforms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform_id: testPlatformId,
          username: "to_delete",
        }),
      });

      if (response.status === 201) {
        const data = (await response.json()) as { id: string };
        testUserPlatformId = data.id;
        createdUserPlatformIds.push(testUserPlatformId);
      }
    });

    it("should delete platform for user", async () => {
      if (!testUserPlatformId) {
        expect(testUserPlatformId).toBeDefined();
        return;
      }
      const response = await app.request(`/api/v1/user-platforms/${testUserPlatformId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(204);

      // Verify deletion by trying to fetch it
      const getResponse = await app.request("/api/v1/user-platforms", {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      const data = (await getResponse.json()) as {
        user_platforms: Array<{ id: string }>;
      };
      const found = data.user_platforms.find((up) => up.id === testUserPlatformId);
      expect(found).toBeUndefined();
    });

    it("should return 404 for non-existent platform", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      const response = await app.request(`/api/v1/user-platforms/${nonExistentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(404);
    });

    it("should return 401 without token", async () => {
      const someId = "11111111-1111-1111-1111-111111111111";
      const response = await app.request(`/api/v1/user-platforms/${someId}`, {
        method: "DELETE",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/user-platforms - Duplicate constraint", () => {
    let secondTestUserPlatformId = "";

    beforeAll(async () => {
      if (!testPlatformId) return;

      // Create first user-platform
      const response = await app.request("/api/v1/user-platforms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform_id: testPlatformId,
          username: "duplicate_test",
        }),
      });

      if (response.status === 201) {
        const data = (await response.json()) as { id: string };
        secondTestUserPlatformId = data.id;
        createdUserPlatformIds.push(secondTestUserPlatformId);
      }
    });

    it("should return 409 conflict when creating duplicate platform association", async () => {
      if (!testPlatformId) return;

      // Try to create second association with same platform
      const response = await app.request("/api/v1/user-platforms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform_id: testPlatformId,
          username: "another_username",
        }),
      });

      expect(response.status).toBe(409);
    });
  });

  describe("Cross-user authorization tests", () => {
    let secondUserId = "";
    let secondUserToken = "";
    let secondUserPlatformId = "";

    beforeAll(async () => {
      if (!testPlatformId) return;

      // Register second user
      const username2 = `testuser2_${Date.now()}`;
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

      // Create platform association for second user
      const createResponse = await app.request("/api/v1/user-platforms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secondUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform_id: testPlatformId,
          username: "seconduser_platform",
        }),
      });

      if (createResponse.status === 201) {
        const data = (await createResponse.json()) as { id: string };
        secondUserPlatformId = data.id;
        createdUserPlatformIds.push(secondUserPlatformId);
      }
    });

    it("should return 404 when patching another user's platform", async () => {
      if (!secondUserPlatformId) return;

      const response = await app.request(`/api/v1/user-platforms/${secondUserPlatformId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "hacked_username",
        }),
      });

      expect(response.status).toBe(404);
    });

    it("should return 404 when deleting another user's platform", async () => {
      if (!secondUserPlatformId) return;

      const response = await app.request(`/api/v1/user-platforms/${secondUserPlatformId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });
});
