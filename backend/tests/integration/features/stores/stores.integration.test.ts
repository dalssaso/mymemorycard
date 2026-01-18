import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import "reflect-metadata";
import { randomUUID } from "crypto";
import { eq, inArray } from "drizzle-orm";
import { container, registerDependencies, resetContainer } from "@/container";
import { stores, users } from "@/db/schema";
import type { StoreListResponse, StoreResponse } from "@/features/stores/dtos/store.dto";
import { createHonoApp } from "@/infrastructure/http/app";
import { DatabaseConnection } from "@/infrastructure/database/connection";

describe("Stores Integration Tests", () => {
  let app: ReturnType<typeof createHonoApp>;
  let dbConnection: DatabaseConnection;
  const createdUserIds: string[] = [];
  let seededStoreId: string;

  beforeAll(async () => {
    registerDependencies();
    app = createHonoApp();
    dbConnection = container.resolve(DatabaseConnection);

    const [store] = await dbConnection.db
      .select({ id: stores.id, slug: stores.slug })
      .from(stores)
      .where(eq(stores.slug, "steam"))
      .limit(1);

    if (!store) {
      throw new Error("Seeded store 'steam' not found");
    }

    seededStoreId = store.id;
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
    const username = `stores_${Date.now()}`;
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

  describe("GET /api/v1/stores", () => {
    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/stores");

      expect(response.status).toBe(401);
    });

    it("should return stores with auth", async () => {
      const { token } = await registerUser();
      const response = await app.request("/api/v1/stores", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = (await response.json()) as StoreListResponse;
      const steam = data.stores.find((store) => store.slug === "steam");

      expect(data.stores.length).toBeGreaterThan(0);
      expect(steam).toBeDefined();
      expect(steam?.display_name).toBeDefined();
      expect(steam?.store_type).toBe("digital");
      expect(steam?.supports_achievements).toBe(true);
      expect(steam && "displayName" in steam).toBe(false);
    });
  });

  describe("GET /api/v1/stores/:id", () => {
    it("should return 401 without token", async () => {
      const response = await app.request(`/api/v1/stores/${seededStoreId}`);

      expect(response.status).toBe(401);
    });

    it("should return store by id", async () => {
      const { token } = await registerUser();
      const response = await app.request(`/api/v1/stores/${seededStoreId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = (await response.json()) as StoreResponse;
      expect(data.store.id).toBe(seededStoreId);
      expect(data.store.slug).toBe("steam");
      expect(data.store.display_name).toBeDefined();
      expect(data.store.store_type).toBe("digital");
    });

    it("should return 400 for invalid store id", async () => {
      const { token } = await registerUser();

      const response = await app.request("/api/v1/stores/not-a-valid-uuid", {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toContain("application/json");
    });

    it("should return 404 for unknown store", async () => {
      const { token } = await registerUser();
      const missingId = randomUUID();

      const response = await app.request(`/api/v1/stores/${missingId}`, {
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
