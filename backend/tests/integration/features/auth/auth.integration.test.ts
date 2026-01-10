import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { registerDependencies, resetContainer, container } from "@/container";
import { createHonoApp } from "@/infrastructure/http/app";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { users } from "@/db/schema";
import { inArray } from "drizzle-orm";

describe("Auth Integration Tests", () => {
  let app: ReturnType<typeof createHonoApp>;
  let dbConnection: DatabaseConnection;
  const createdUserIds: string[] = [];

  beforeAll(() => {
    // Bun automatically loads .env files
    registerDependencies();
    app = createHonoApp();
    dbConnection = container.resolve(DatabaseConnection);
  });

  afterAll(async () => {
    // Clean up only test-created users
    try {
      if (createdUserIds.length > 0) {
        await dbConnection.db.delete(users).where(inArray(users.id, createdUserIds)).execute();
      }
    } catch {
      // Cleanup errors are non-critical
    }
    await dbConnection.close();
    resetContainer();
  });

  describe("POST /api/auth/register", () => {
    it("should register new user", async () => {
      const username = `testuser_${Date.now()}`;
      const response = await app.request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email: `${username}@example.com`,
          password: "SecurePass123!",
        }),
      });

      expect(response.status).toBe(201);

      const data = (await response.json()) as {
        user: { id: string; username: string };
        token: string;
      };
      createdUserIds.push(data.user.id);
      expect(data.user.username).toBe(username);
      expect(data.token).toBeDefined();
    });

    it("should return 400 for invalid data", async () => {
      const response = await app.request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "ab", // Too short
          email: "invalid-email",
          password: "123", // Too short
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for username with invalid characters", async () => {
      const response = await app.request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "user name", // Space
          email: "test@example.com",
          password: "SecurePass123!",
        }),
      });

      expect(response.status).toBe(400);
    });

    [
      { username: "user123", desc: "with numbers" },
      { username: "user_name", desc: "with underscore" },
      { username: "user-name", desc: "with hyphen" },
      { username: "User_Test-123", desc: "with mixed case" },
    ].forEach(({ username: baseUsername, desc }) => {
      it(`should accept username "${baseUsername}" ${desc}`, async () => {
        const uniqueUsername = `${baseUsername}_${Date.now()}`;
        const response = await app.request("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: uniqueUsername,
            email: `${uniqueUsername}@example.com`,
            password: "SecurePass123!",
          }),
        });

        expect(response.status).toBe(201);
        const data = (await response.json()) as {
          user: { id: string; username: string };
        };
        createdUserIds.push(data.user.id);
        expect(data.user.username).toBe(uniqueUsername);
      });
    });

    it("should return 409 for duplicate username", async () => {
      const username = `duplicate_${Date.now()}`;

      // First registration
      const firstResponse = await app.request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email: `${username}@example.com`,
          password: "SecurePass123!",
        }),
      });

      // Verify first registration succeeded
      expect(firstResponse.status).toBe(201);
      const firstData = (await firstResponse.json()) as {
        user: { id: string };
      };
      createdUserIds.push(firstData.user.id);

      // Second registration with same username
      const response = await app.request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email: `${username}_2@example.com`,
          password: "SecurePass123!",
        }),
      });

      expect(response.status).toBe(409);

      const data = (await response.json()) as { code: string };
      expect(data.code).toBe("CONFLICT");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login existing user", async () => {
      const username = `logintest_${Date.now()}`;
      const password = "SecurePass123!";

      // Register user first
      const registerResponse = await app.request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email: `${username}@example.com`,
          password,
        }),
      });
      const registerData = (await registerResponse.json()) as {
        user: { id: string };
      };
      createdUserIds.push(registerData.user.id);

      // Login
      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        user: { username: string };
        token: string;
      };
      expect(data.user.username).toBe(username);
      expect(data.token).toBeDefined();
    });

    it("should return 401 for invalid credentials", async () => {
      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "nonexistent",
          password: "wrongpassword",
        }),
      });

      expect(response.status).toBe(401);

      const data = (await response.json()) as { code: string };
      expect(data.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /metrics", () => {
    it("should return prometheus metrics", async () => {
      const response = await app.request("/metrics");

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/plain");

      const text = await response.text();
      expect(text).toContain("mymemorycard_http_requests_total");
      expect(text).toContain("mymemorycard_auth_attempts_total");
    });
  });
});
