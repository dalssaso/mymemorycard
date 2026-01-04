/**
 * Integration Tests: Auth Routes
 *
 * Prerequisites:
 * - docker compose up -d (postgres and redis running)
 * - Backend server running on localhost:3000
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { API_BASE_URL, testPool, closeTestPool } from "../setup/integration.setup";

describe("Auth Routes (integration)", () => {
  const testEmail = "authtest@test.com";
  const testPassword = "password123";
  let authToken: string;

  beforeAll(async () => {
    await testPool.query("DELETE FROM users WHERE email = $1", [testEmail]);

    const registerRes = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "authtest",
        email: testEmail,
        password: testPassword,
      }),
    });

    const data = (await registerRes.json()) as { token: string };
    authToken = data.token;
  });

  afterAll(async () => {
    await testPool.query("DELETE FROM users WHERE email = $1", [testEmail]);
    await closeTestPool();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const uniqueEmail = `newuser${Date.now()}@test.com`;

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "newuser",
          email: uniqueEmail,
          password: testPassword,
        }),
      });

      const data = (await response.json()) as {
        user: { email: string };
        token: string;
      };

      expect(response.status).toBe(201);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(uniqueEmail);
      expect(data.token).toBeDefined();

      await testPool.query("DELETE FROM users WHERE email = $1", [uniqueEmail]);
    });

    it("should reject registration with existing email", async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "duplicate",
          email: testEmail,
          password: testPassword,
        }),
      });

      expect(response.status).toBe(409);
    });

    it("should reject registration with weak password", async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser3",
          email: "testuser3@test.com",
          password: "123",
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      const data = (await response.json()) as {
        user: { email: string };
        token: string;
      };

      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.token).toBeDefined();
    });

    it("should reject login with invalid password", async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: "wrongpassword",
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should reject login with non-existent email", async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@test.com",
          password: testPassword,
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return user data with valid token", async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = (await response.json()) as { user: { email: string } };

      expect(response.status).toBe(200);
      expect(data.user.email).toBe(testEmail);
    });

    it("should reject request without token", async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`);

      expect(response.status).toBe(401);
    });

    it("should reject request with invalid token", async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: "Bearer invalid-token" },
      });

      expect(response.status).toBe(401);
    });
  });
});
