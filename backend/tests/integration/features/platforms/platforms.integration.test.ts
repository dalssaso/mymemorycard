import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { registerDependencies, resetContainer, container } from "@/container";
import { createHonoApp } from "@/infrastructure/http/app";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { platforms, users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import type {
  PlatformListResponse,
  PlatformResponse,
} from "@/features/platforms/dtos/platform.dto";
import { randomUUID } from "crypto";

describe("Platforms Integration Tests", () => {
  let app: ReturnType<typeof createHonoApp>;
  let dbConnection: DatabaseConnection;
  const createdUserIds: string[] = [];
  let seededPlatformId: string;

  beforeAll(async () => {
    registerDependencies();
    app = createHonoApp();
    dbConnection = container.resolve(DatabaseConnection);

    const [platform] = await dbConnection.db
      .select({ id: platforms.id })
      .from(platforms)
      .where(eq(platforms.name, "steam"))
      .limit(1);

    if (!platform) {
      throw new Error("Seeded platform 'steam' not found");
    }

    seededPlatformId = platform.id;
  });

  afterAll(async () => {
    try {
      if (createdUserIds.length > 0) {
        await dbConnection.db.delete(users).where(inArray(users.id, createdUserIds)).execute();
      }
    } catch (error) {
      console.error(
        `Error cleaning up test users (${createdUserIds.length} to delete):`,
        error instanceof Error ? error.message : error
      );
    }

    await dbConnection.close();
    resetContainer();
  });

  async function registerUser(): Promise<{ token: string; userId: string }> {
    const username = `platforms_${Date.now()}`;
    const response = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email: `${username}@example.com`,
        password: "SecurePass123!",
      }),
    });

    expect(response.status).toBe(201);
    const data = (await response.json()) as { user: { id: string }; token: string };
    createdUserIds.push(data.user.id);

    return { token: data.token, userId: data.user.id };
  }

  describe("GET /api/v1/platforms", () => {
    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/platforms");

      expect(response.status).toBe(401);
    });

    it("should return platforms with auth", async () => {
      const { token } = await registerUser();
      const response = await app.request("/api/v1/platforms", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = (await response.json()) as PlatformListResponse;
      const steam = data.platforms.find((platform) => platform.name === "steam");

      expect(data.platforms.length).toBeGreaterThan(0);
      expect(steam).toBeDefined();
      expect(steam?.abbreviation).toBeDefined();
      expect(steam?.color_primary).toBeDefined();
      expect(steam && "displayName" in steam).toBe(false);
    });
  });

  describe("GET /api/v1/platforms/:id", () => {
    it("should return 401 without token", async () => {
      const response = await app.request(`/api/v1/platforms/${seededPlatformId}`);

      expect(response.status).toBe(401);
    });

    it("should return platform by id", async () => {
      const { token } = await registerUser();
      const response = await app.request(`/api/v1/platforms/${seededPlatformId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = (await response.json()) as PlatformResponse;
      expect(data.platform.id).toBe(seededPlatformId);
      expect(data.platform.name).toBe("steam");
      expect(data.platform.abbreviation).toBeDefined();
      expect(data.platform.color_primary).toBeDefined();
    });

    it("should return 400 for invalid platform id", async () => {
      const { token } = await registerUser();

      const response = await app.request("/api/v1/platforms/not-a-valid-uuid", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toContain("application/json");
    });

    it("should return 404 for unknown platform", async () => {
      const { token } = await registerUser();
      const missingId = randomUUID();

      const response = await app.request(`/api/v1/platforms/${missingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = (await response.json()) as { code?: string; request_id?: string };
      expect(data.code).toBe("NOT_FOUND");
      expect(data.request_id).toBeDefined();
    });
  });
});
