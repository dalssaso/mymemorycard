import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import "reflect-metadata";
import { inArray, eq } from "drizzle-orm";
import { registerDependencies, resetContainer, container } from "@/container";
import { IGDB_SERVICE_TOKEN } from "@/container/tokens";
import { createHonoApp } from "@/infrastructure/http/app";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { users, userGames, games, platforms, stores, userApiCredentials } from "@/db/schema";
import { createMockIgdbService } from "@/tests/helpers/repository.mocks";
import { ENCRYPTION_SERVICE_TOKEN } from "@/container/tokens";
import type { IEncryptionService } from "@/features/credentials/services/encryption.service.interface";
import { randomUUID } from "crypto";

describe("Games Integration Tests", () => {
  let app: ReturnType<typeof createHonoApp>;
  let dbConnection: DatabaseConnection;
  const createdUserIds: string[] = [];
  let testUserToken: string;
  let testUserId: string;
  let testUser2Token: string;
  let testUser2Id: string;
  let pcPlatformId: string;
  let ps5PlatformId: string;
  let steamStoreId: string;
  const createdGameIds: string[] = [];
  const createdUserGameIds: string[] = [];

  beforeAll(async () => {
    registerDependencies();

    // Override IGDB service with mock to avoid real API calls
    container.registerInstance(IGDB_SERVICE_TOKEN, createMockIgdbService());

    app = createHonoApp();
    dbConnection = container.resolve(DatabaseConnection);

    // Find seeded platforms
    const pcPlatform = await dbConnection.db.query.platforms.findFirst({
      where: eq(platforms.name, "PC (Microsoft Windows)"),
    });

    const ps5Platform = await dbConnection.db.query.platforms.findFirst({
      where: eq(platforms.name, "PlayStation 5"),
    });

    if (!pcPlatform || !ps5Platform) {
      throw new Error("Required seeded platforms not found");
    }

    pcPlatformId = pcPlatform.id;
    ps5PlatformId = ps5Platform.id;

    // Find seeded Steam store
    const steamStore = await dbConnection.db.query.stores.findFirst({
      where: eq(stores.slug, "steam"),
    });

    if (!steamStore) {
      throw new Error("Seeded Steam store not found");
    }

    steamStoreId = steamStore.id;

    // Create first test user
    const username1 = `gamestest_${Date.now()}`;
    const registerResponse1 = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username1,
        email: `${username1}@example.com`,
        password: "SecurePass123!",
      }),
    });

    if (!registerResponse1.ok) {
      const errorBody = await registerResponse1.text();
      throw new Error(`Failed to register test user 1: ${registerResponse1.status} - ${errorBody}`);
    }

    const registerData1 = (await registerResponse1.json()) as {
      user: { id: string };
      token: string;
    };

    testUserId = registerData1.user.id;
    testUserToken = registerData1.token;
    createdUserIds.push(testUserId);

    // Create second test user for cross-user authorization tests
    const username2 = `gamestest2_${Date.now()}`;
    const registerResponse2 = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username2,
        email: `${username2}@example.com`,
        password: "SecurePass123!",
      }),
    });

    if (!registerResponse2.ok) {
      const errorBody = await registerResponse2.text();
      throw new Error(`Failed to register test user 2: ${registerResponse2.status} - ${errorBody}`);
    }

    const registerData2 = (await registerResponse2.json()) as {
      user: { id: string };
      token: string;
    };

    testUser2Id = registerData2.user.id;
    testUser2Token = registerData2.token;
    createdUserIds.push(testUser2Id);

    // Create IGDB credentials for both test users directly in DB (required for search/import)
    const encryptionService = container.resolve<IEncryptionService>(ENCRYPTION_SERVICE_TOKEN);
    const credentialData = { client_id: "test", client_secret: "test" };
    const encryptedCreds = encryptionService.encrypt(credentialData);

    try {
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
    } catch (error) {
      throw new Error(
        `Failed to create IGDB credentials: ${error instanceof Error ? error.message : error}`
      );
    }
  });

  afterAll(async () => {
    try {
      // Clean up user games first (foreign key constraint)
      // Filter out empty/undefined IDs
      const validUserGameIds = createdUserGameIds.filter((id) => id && id.trim().length > 0);
      if (validUserGameIds.length > 0) {
        await dbConnection.db
          .delete(userGames)
          .where(inArray(userGames.id, validUserGameIds))
          .execute();
      }

      // Clean up games (only those we created)
      // Filter out empty/undefined IDs
      const validGameIds = createdGameIds.filter((id) => id && id.trim().length > 0);
      if (validGameIds.length > 0) {
        await dbConnection.db.delete(games).where(inArray(games.id, validGameIds)).execute();
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

  /**
   * Helper to create a test game in the database
   */
  async function createTestGame(name: string, igdbId: number): Promise<string> {
    const [game] = await dbConnection.db
      .insert(games)
      .values({
        igdbId,
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        metadataSource: "igdb",
      })
      .returning({ id: games.id });

    if (!game) {
      throw new Error("Failed to create test game");
    }

    createdGameIds.push(game.id);
    return game.id;
  }

  describe("POST /api/v1/games/search", () => {
    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/games/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "test" }),
      });

      expect(response.status).toBe(401);
    });

    it("should search games successfully with valid query", async () => {
      const response = await app.request("/api/v1/games/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "The Legend of Zelda", limit: 10 }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        results: Array<{ id: string; name: string }>;
      };
      expect(Array.isArray(data.results)).toBe(true);
    });

    it("should return 400 for empty search query", async () => {
      const response = await app.request("/api/v1/games/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "" }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for search query exceeding limit", async () => {
      const longQuery = "a".repeat(256);
      const response = await app.request("/api/v1/games/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: longQuery }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid limit value", async () => {
      const response = await app.request("/api/v1/games/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "test", limit: 101 }),
      });

      expect(response.status).toBe(400);
    });

    it("should respect limit parameter", async () => {
      const response = await app.request("/api/v1/games/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "a", limit: 5 }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        results: Array<{ id: string }>;
      };
      expect(data.results.length).toBeLessThanOrEqual(5);
    });
  });

  describe("POST /api/v1/games/:id/import", () => {
    let testGameId: string;
    let testIgdbId: number;

    beforeEach(async () => {
      // Use unique IGDB ID for each test to avoid conflicts
      testIgdbId = Math.floor(Math.random() * 100000) + 800000;
      testGameId = await createTestGame("Test Game Import", testIgdbId);
    });

    it("should return 401 without token", async () => {
      const response = await app.request(`/api/v1/games/${testGameId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          igdb_id: testIgdbId,
          platform_id: pcPlatformId,
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should import game to user library successfully", async () => {
      const response = await app.request(`/api/v1/games/${testGameId}/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          igdb_id: testIgdbId,
          platform_id: pcPlatformId,
        }),
      });

      if (response.status !== 200) {
        const body = await response.text();
        console.error(`Import failed with ${response.status}:`, body);
      }

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        id: string;
        user_id: string;
        game?: { id: string };
        platform: { id: string };
      };
      if (!data.id) {
        console.error("Response:", JSON.stringify(data));
      }

      expect(data.id).toBeDefined();
      expect(data.user_id).toBe(testUserId);
      expect(data.game?.id).toBeDefined();
      expect(data.platform.id).toBe(pcPlatformId);

      createdUserGameIds.push(data.id);
    });

    it("should import game with optional store parameter", async () => {
      const response = await app.request(`/api/v1/games/${testGameId}/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          igdb_id: testIgdbId,
          platform_id: pcPlatformId,
          store_id: steamStoreId,
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        id: string;
        store: { id: string } | null;
      };
      expect(data.id).toBeDefined();
      expect(data.store?.id).toBe(steamStoreId);

      createdUserGameIds.push(data.id);
    });

    it("should return 400 for invalid platform ID format", async () => {
      const response = await app.request(`/api/v1/games/${testGameId}/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          igdb_id: testIgdbId,
          platform_id: "not-a-valid-uuid",
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent platform", async () => {
      const nonExistentPlatformId = randomUUID();
      const response = await app.request(`/api/v1/games/${testGameId}/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          igdb_id: testIgdbId,
          platform_id: nonExistentPlatformId,
        }),
      });

      expect(response.status).toBe(404);
    });

    it("should return 404 for non-existent store", async () => {
      const nonExistentStoreId = randomUUID();
      const response = await app.request(`/api/v1/games/${testGameId}/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          igdb_id: testIgdbId,
          platform_id: pcPlatformId,
          store_id: nonExistentStoreId,
        }),
      });

      expect(response.status).toBe(404);
    });

    it("should succeed even with non-UUID game ID in URL (URL param is ignored)", async () => {
      // The import route uses igdb_id from the body, not the URL param
      // So any value in the URL path is accepted
      const response = await app.request("/api/v1/games/not-a-uuid/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          igdb_id: testIgdbId,
          platform_id: pcPlatformId,
        }),
      });

      // Import should succeed since URL param is not validated
      expect(response.status).toBe(200);
      const data = (await response.json()) as { id: string };
      if (data.id) {
        createdUserGameIds.push(data.id);
      }
    });
  });

  describe("GET /api/v1/user-games", () => {
    let userGame1Id: string;
    let userGame2Id: string;

    beforeEach(async () => {
      // Use unique IGDB IDs to avoid conflicts
      const igdbId1 = Math.floor(Math.random() * 100000) + 300000;
      const igdbId2 = Math.floor(Math.random() * 100000) + 400000;

      // Create test games
      const game1Id = await createTestGame("Test Game 1", igdbId1);
      const game2Id = await createTestGame("Test Game 2", igdbId2);

      // Add games to user library
      const response1 = await app.request(`/api/v1/games/${game1Id}/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          igdb_id: igdbId1,
          platform_id: pcPlatformId,
        }),
      });

      if (!response1.ok) {
        const body = await response1.text();
        throw new Error(`Failed to create user game 1: ${response1.status} - ${body}`);
      }

      const data1 = (await response1.json()) as { id: string };
      userGame1Id = data1.id;
      createdUserGameIds.push(userGame1Id);

      const response2 = await app.request(`/api/v1/games/${game2Id}/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          igdb_id: igdbId2,
          platform_id: ps5PlatformId,
        }),
      });

      if (!response2.ok) {
        const body = await response2.text();
        throw new Error(`Failed to create user game 2: ${response2.status} - ${body}`);
      }

      const data2 = (await response2.json()) as { id: string };
      userGame2Id = data2.id;
      createdUserGameIds.push(userGame2Id);
    });

    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/user-games");

      expect(response.status).toBe(401);
    });

    it("should list user games successfully", async () => {
      const response = await app.request("/api/v1/user-games", {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        user_games: Array<{ id: string; user_id: string }>;
      };
      expect(Array.isArray(data.user_games)).toBe(true);
      expect(data.user_games.length).toBeGreaterThanOrEqual(2);

      const ids = data.user_games.map((g) => g.id);
      expect(ids).toContain(userGame1Id);
      expect(ids).toContain(userGame2Id);

      // Verify user_id ownership
      data.user_games.forEach((game) => {
        expect(game.user_id).toBe(testUserId);
      });
    });

    it("should return empty list for new user with no games", async () => {
      const username = `newgamesuser_${Date.now()}`;
      const registerResponse = await app.request("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email: `${username}@example.com`,
          password: "SecurePass123!",
        }),
      });

      const registerData = (await registerResponse.json()) as {
        user: { id: string };
        token: string;
      };
      createdUserIds.push(registerData.user.id);

      const response = await app.request("/api/v1/user-games", {
        headers: { Authorization: `Bearer ${registerData.token}` },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as { user_games: Array<object> };
      expect(data.user_games).toHaveLength(0);
    });

    it("should return games with correct structure", async () => {
      const response = await app.request("/api/v1/user-games", {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      const data = (await response.json()) as {
        user_games: Array<{
          id: string;
          user_id: string;
          game: { id: string; name: string };
          platform: { id: string; name: string };
        }>;
      };

      expect(data.user_games.length).toBeGreaterThan(0);

      const game = data.user_games[0];
      expect(game.id).toBeDefined();
      expect(game.user_id).toBeDefined();
      expect(game.game.id).toBeDefined();
      expect(game.game.name).toBeDefined();
      expect(game.platform.id).toBeDefined();
      expect(game.platform.name).toBeDefined();
    });
  });

  describe("GET /api/v1/user-games/:id", () => {
    let userGameId: string;
    let gameId: string;

    beforeEach(async () => {
      const igdbId = Math.floor(Math.random() * 100000) + 500000;
      gameId = await createTestGame("Test Game Get", igdbId);

      const response = await app.request(`/api/v1/games/${gameId}/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          igdb_id: igdbId,
          platform_id: pcPlatformId,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to create user game: ${response.status} - ${body}`);
      }

      const data = (await response.json()) as { id: string };
      userGameId = data.id;
      createdUserGameIds.push(userGameId);
    });

    it("should return 401 without token", async () => {
      const response = await app.request(`/api/v1/user-games/${userGameId}`);

      expect(response.status).toBe(401);
    });

    it("should retrieve user game successfully", async () => {
      const response = await app.request(`/api/v1/user-games/${userGameId}`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        id: string;
        user_id: string;
        game: { id: string };
        platform: { id: string };
      };
      expect(data.id).toBe(userGameId);
      expect(data.user_id).toBe(testUserId);
      expect(data.game.id).toBe(gameId);
    });

    it("should return 400 for invalid user game ID format", async () => {
      const response = await app.request("/api/v1/user-games/not-a-uuid", {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent user game", async () => {
      const nonExistentId = randomUUID();
      const response = await app.request(`/api/v1/user-games/${nonExistentId}`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(404);
    });

    it("should return 404 when accessing another user game (404 not 403)", async () => {
      const response = await app.request(`/api/v1/user-games/${userGameId}`, {
        headers: { Authorization: `Bearer ${testUser2Token}` },
      });

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/v1/user-games/:id", () => {
    let userGameId: string;

    beforeEach(async () => {
      const igdbId = Math.floor(Math.random() * 100000) + 600000;
      const gameId = await createTestGame("Test Game Patch", igdbId);

      const response = await app.request(`/api/v1/games/${gameId}/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          igdb_id: igdbId,
          platform_id: pcPlatformId,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to create user game: ${response.status} - ${body}`);
      }

      const data = (await response.json()) as { id: string };
      userGameId = data.id;
      createdUserGameIds.push(userGameId);
    });

    it("should return 401 without token", async () => {
      const response = await app.request(`/api/v1/user-games/${userGameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owned: false }),
      });

      expect(response.status).toBe(401);
    });

    it("should update user game owned status", async () => {
      const response = await app.request(`/api/v1/user-games/${userGameId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ owned: false }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as { owned: boolean };
      expect(data.owned).toBe(false);
    });

    it("should update user game purchased_date", async () => {
      // Note: purchased_date is stored as date only in DB, time portion is ignored
      const testDate = "2024-06-15T12:00:00.000Z";
      const response = await app.request(`/api/v1/user-games/${userGameId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ purchased_date: testDate }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as { purchased_date: string | null };
      expect(data.purchased_date).toMatch(/^2024-06-15/);
    });

    it("should update multiple fields at once", async () => {
      // Note: purchased_date is stored as date only in DB, time portion is ignored
      const testDate = "2024-07-20T10:00:00.000Z";
      const response = await app.request(`/api/v1/user-games/${userGameId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owned: true,
          purchased_date: testDate,
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        owned: boolean;
        purchased_date: string | null;
      };
      expect(data.owned).toBe(true);
      expect(data.purchased_date).toMatch(/^2024-07-20/);
    });

    it("should return 400 for invalid purchased_date value", async () => {
      const response = await app.request(`/api/v1/user-games/${userGameId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ purchased_date: "not-a-date" }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 when no fields provided", async () => {
      const response = await app.request(`/api/v1/user-games/${userGameId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent user game", async () => {
      const nonExistentId = randomUUID();
      const response = await app.request(`/api/v1/user-games/${nonExistentId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ owned: false }),
      });

      expect(response.status).toBe(404);
    });

    it("should return 404 when updating another user game (404 not 403)", async () => {
      const response = await app.request(`/api/v1/user-games/${userGameId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUser2Token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ owned: false }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/v1/user-games/:id", () => {
    let userGameId: string;

    beforeEach(async () => {
      const igdbId = Math.floor(Math.random() * 100000) + 700000;
      const gameId = await createTestGame("Test Game Delete", igdbId);

      const response = await app.request(`/api/v1/games/${gameId}/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          igdb_id: igdbId,
          platform_id: pcPlatformId,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to create user game: ${response.status} - ${body}`);
      }

      const data = (await response.json()) as { id: string };
      userGameId = data.id;
      createdUserGameIds.push(userGameId);
    });

    it("should return 401 without token", async () => {
      const response = await app.request(`/api/v1/user-games/${userGameId}`, {
        method: "DELETE",
      });

      expect(response.status).toBe(401);
    });

    it("should delete user game successfully", async () => {
      const response = await app.request(`/api/v1/user-games/${userGameId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(204);

      // Verify deletion by attempting to retrieve
      const getResponse = await app.request(`/api/v1/user-games/${userGameId}`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });
      expect(getResponse.status).toBe(404);
    });

    it("should return 400 for invalid user game ID format", async () => {
      const response = await app.request("/api/v1/user-games/not-a-uuid", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(400);
    });

    it("should return 404 for non-existent user game", async () => {
      const nonExistentId = randomUUID();
      const response = await app.request(`/api/v1/user-games/${nonExistentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(404);
    });

    it("should return 404 when deleting another user game (404 not 403)", async () => {
      const response = await app.request(`/api/v1/user-games/${userGameId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUser2Token}` },
      });

      expect(response.status).toBe(404);
    });
  });

  describe("Cross-user authorization tests", () => {
    let user1GameId: string;
    let user2GameId: string;

    beforeEach(async () => {
      // Use unique IGDB IDs to avoid conflicts between test runs
      const igdbId1 = Math.floor(Math.random() * 100000) + 100000;
      const igdbId2 = Math.floor(Math.random() * 100000) + 200000;

      // Create games for each user
      const game1 = await createTestGame("User 1 Game", igdbId1);
      const game2 = await createTestGame("User 2 Game", igdbId2);

      // User 1 imports game
      const response1 = await app.request(`/api/v1/games/${game1}/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          igdb_id: igdbId1,
          platform_id: pcPlatformId,
        }),
      });

      if (!response1.ok) {
        const body = await response1.text();
        throw new Error(`User 1 import failed: ${response1.status} - ${body}`);
      }

      const data1 = (await response1.json()) as { id: string };
      user1GameId = data1.id;
      createdUserGameIds.push(user1GameId);

      // User 2 imports game
      const response2 = await app.request(`/api/v1/games/${game2}/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUser2Token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          igdb_id: igdbId2,
          platform_id: ps5PlatformId,
        }),
      });

      if (!response2.ok) {
        const body = await response2.text();
        throw new Error(`User 2 import failed: ${response2.status} - ${body}`);
      }

      const data2 = (await response2.json()) as { id: string };
      user2GameId = data2.id;
      createdUserGameIds.push(user2GameId);
    });

    it("user 1 should not access user 2 games in list", async () => {
      const response = await app.request("/api/v1/user-games", {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        user_games?: Array<{ id: string }>;
      };
      if (!data.user_games) {
        throw new Error("Response missing user_games field: " + JSON.stringify(data));
      }

      const ids = data.user_games.map((g) => g.id);

      expect(ids).toContain(user1GameId);
      expect(ids).not.toContain(user2GameId);
    });

    it("user 2 should not access user 1 games in list", async () => {
      const response = await app.request("/api/v1/user-games", {
        headers: { Authorization: `Bearer ${testUser2Token}` },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        user_games?: Array<{ id: string }>;
      };
      if (!data.user_games) {
        throw new Error("Response missing user_games field: " + JSON.stringify(data));
      }

      const ids = data.user_games.map((g) => g.id);

      expect(ids).toContain(user2GameId);
      expect(ids).not.toContain(user1GameId);
    });

    it("user 1 cannot retrieve user 2 game (404)", async () => {
      const response = await app.request(`/api/v1/user-games/${user2GameId}`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(404);
    });

    it("user 2 cannot retrieve user 1 game (404)", async () => {
      const response = await app.request(`/api/v1/user-games/${user1GameId}`, {
        headers: { Authorization: `Bearer ${testUser2Token}` },
      });

      expect(response.status).toBe(404);
    });

    it("user 1 cannot update user 2 game (404)", async () => {
      const response = await app.request(`/api/v1/user-games/${user2GameId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ owned: false }),
      });

      expect(response.status).toBe(404);
    });

    it("user 1 cannot delete user 2 game (404)", async () => {
      const response = await app.request(`/api/v1/user-games/${user2GameId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(response.status).toBe(404);
    });
  });

  describe("Complete workflow tests", () => {
    it("should support complete game workflow: import, retrieve, update, delete", async () => {
      // 1. Create test game with unique IGDB ID to avoid conflicts
      const uniqueIgdbId = Math.floor(Math.random() * 100000) + 50000;
      const gameId = await createTestGame("Complete Workflow Game", uniqueIgdbId);

      // 2. Import game to user library
      const importResponse = await app.request(`/api/v1/games/${gameId}/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          igdb_id: uniqueIgdbId,
          platform_id: pcPlatformId,
          store_id: steamStoreId,
        }),
      });

      expect(importResponse.status).toBe(200);

      const importData = (await importResponse.json()) as {
        id: string;
        owned: boolean;
        purchased_date: string | null;
      };
      const userGameId = importData.id;
      createdUserGameIds.push(userGameId);

      // Verify initial state (owned is true when imported with a store)
      expect(importData.owned).toBe(true);

      // 3. List user games and verify game appears
      const listResponse = await app.request("/api/v1/user-games", {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      if (listResponse.status !== 200) {
        const body = await listResponse.text();
        console.error(`List failed with ${listResponse.status}:`, body);
      }

      expect(listResponse.status).toBe(200);

      const listData = (await listResponse.json()) as {
        user_games: Array<{ id: string }>;
      };
      const listedGameIds = listData.user_games.map((g) => g.id);
      expect(listedGameIds).toContain(userGameId);

      // 4. Retrieve specific user game
      const getResponse = await app.request(`/api/v1/user-games/${userGameId}`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(getResponse.status).toBe(200);

      const getdata = (await getResponse.json()) as {
        id: string;
        owned: boolean;
      };
      expect(getdata.id).toBe(userGameId);
      expect(getdata.owned).toBe(true);

      // 5. Update user game with owned and purchased_date
      // Note: purchased_date is stored as date only, time is ignored
      const testPurchaseDate = "2024-06-15T12:00:00.000Z";
      const updateResponse = await app.request(`/api/v1/user-games/${userGameId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owned: false,
          purchased_date: testPurchaseDate,
        }),
      });

      expect(updateResponse.status).toBe(200);

      const updateData = (await updateResponse.json()) as {
        owned: boolean;
        purchased_date: string | null;
      };
      expect(updateData.owned).toBe(false);
      // Database stores date only, check that it starts with the correct date
      expect(updateData.purchased_date).toMatch(/^2024-06-15/);

      // 6. Verify update persisted
      const verifyResponse = await app.request(`/api/v1/user-games/${userGameId}`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      const verifyData = (await verifyResponse.json()) as {
        owned: boolean;
        purchased_date: string | null;
      };
      expect(verifyData.owned).toBe(false);
      expect(verifyData.purchased_date).toMatch(/^2024-06-15/);

      // 7. Delete user game
      const deleteResponse = await app.request(`/api/v1/user-games/${userGameId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(deleteResponse.status).toBe(204);

      // 8. Verify deletion - game should not be retrievable
      const finalGetResponse = await app.request(`/api/v1/user-games/${userGameId}`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      });

      expect(finalGetResponse.status).toBe(404);
    });
  });
});
