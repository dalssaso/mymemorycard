/**
 * Integration Tests: Import Routes
 *
 * Prerequisites:
 * - docker compose up -d (postgres and redis running)
 * - Backend server running on localhost:3000
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { API_BASE_URL, testPool } from "../setup/integration.setup";

describe("Import Routes (integration)", () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await testPool.query("DELETE FROM users WHERE email LIKE $1", ["%@import-test.com"]);

    const registerResponse = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "importtester",
        email: "importtest@import-test.com",
        password: "password123",
      }),
    });

    const data = (await registerResponse.json()) as {
      user: { id: string };
      token: string;
    };
    authToken = data.token;
    userId = data.user.id;
  });

  afterAll(async () => {
    await testPool.query("DELETE FROM users WHERE id = $1", [userId]);
  });

  describe("POST /api/import/bulk", () => {
    it("should require authentication", async () => {
      const response = await fetch(`${API_BASE_URL}/api/import/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameNames: ["Test Game"] }),
      });

      expect(response.status).toBe(401);
    });

    it("should validate gameNames parameter", async () => {
      const response = await fetch(`${API_BASE_URL}/api/import/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = (await response.json()) as { error: string };
      expect(data.error).toContain("gameNames");
    });

    it("should accept gameNames array", async () => {
      const response = await fetch(`${API_BASE_URL}/api/import/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ gameNames: ["Test Game 1", "Test Game 2"] }),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as {
        imported: unknown[];
        needsReview: unknown[];
      };
      expect(data).toHaveProperty("imported");
      expect(data).toHaveProperty("needsReview");
    });

    it("should accept optional platformId", async () => {
      const platformsResponse = await fetch(`${API_BASE_URL}/api/platforms`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const platformsData = (await platformsResponse.json()) as {
        platforms: Array<{ id: string }>;
      };
      const platformId = platformsData.platforms[0].id;

      const response = await fetch(`${API_BASE_URL}/api/import/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ gameNames: ["Test Game 3"], platformId }),
      });

      expect(response.status).toBe(200);
    });
  });
});
