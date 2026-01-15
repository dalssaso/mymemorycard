import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import "reflect-metadata";

import { eq, inArray } from "drizzle-orm";

import { container, registerDependencies, resetContainer } from "@/container";
import { adminSettings, users } from "@/db/schema";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { createHonoApp } from "@/infrastructure/http/app";

describe("Admin Integration Tests", () => {
  let app: ReturnType<typeof createHonoApp>;
  let dbConnection: DatabaseConnection;
  const createdUserIds: string[] = [];
  let adminUserToken = "";
  let adminUserId = "";
  let regularUserToken = "";
  let regularUserId = "";

  beforeAll(async () => {
    registerDependencies();
    app = createHonoApp();
    dbConnection = container.resolve(DatabaseConnection);

    // Create admin user
    const adminUsername = `admin_test_${Date.now()}`;
    const adminRegisterResponse = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: adminUsername,
        email: `${adminUsername}@example.com`,
        password: "SecurePass123!",
      }),
    });

    if (!adminRegisterResponse.ok) {
      const errorBody = await adminRegisterResponse.text();
      throw new Error(
        `Failed to register admin test user: ${adminRegisterResponse.status} - ${errorBody}`
      );
    }

    const adminRegisterData = (await adminRegisterResponse.json()) as {
      user: { id: string };
      token: string;
    };

    if (!adminRegisterData.user?.id || !adminRegisterData.token) {
      throw new Error(`Invalid registration response: missing user id or token`);
    }

    adminUserId = adminRegisterData.user.id;
    createdUserIds.push(adminUserId);

    // Update user to be admin in database
    await dbConnection.db.update(users).set({ isAdmin: true }).where(eq(users.id, adminUserId));

    // Re-login to get a token that reflects admin status
    const adminLoginResponse = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: adminUsername,
        password: "SecurePass123!",
      }),
    });

    if (!adminLoginResponse.ok) {
      const errorBody = await adminLoginResponse.text();
      throw new Error(`Failed to login admin user: ${adminLoginResponse.status} - ${errorBody}`);
    }

    const adminLoginData = (await adminLoginResponse.json()) as { token: string };
    adminUserToken = adminLoginData.token;

    // Create regular (non-admin) user
    const regularUsername = `regular_test_${Date.now()}`;
    const regularRegisterResponse = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: regularUsername,
        email: `${regularUsername}@example.com`,
        password: "SecurePass123!",
      }),
    });

    if (!regularRegisterResponse.ok) {
      const errorBody = await regularRegisterResponse.text();
      throw new Error(
        `Failed to register regular test user: ${regularRegisterResponse.status} - ${errorBody}`
      );
    }

    const regularRegisterData = (await regularRegisterResponse.json()) as {
      user: { id: string };
      token: string;
    };

    if (!regularRegisterData.user?.id || !regularRegisterData.token) {
      throw new Error(`Invalid registration response for regular user: missing user id or token`);
    }

    regularUserId = regularRegisterData.user.id;
    regularUserToken = regularRegisterData.token;
    createdUserIds.push(regularUserId);
  });

  afterAll(async () => {
    try {
      // Clean up admin_settings (only one row exists, reset to defaults)
      await dbConnection.db
        .update(adminSettings)
        .set({
          analyticsEnabled: false,
          analyticsProvider: null,
          analyticsKey: null,
          analyticsHost: null,
          searchServerSide: true,
          searchDebounceMs: 300,
        })
        .execute();

      // Clean up users
      if (createdUserIds.length > 0) {
        await dbConnection.db.delete(users).where(inArray(users.id, createdUserIds)).execute();
      }
    } catch (error) {
      console.error(`Error cleaning up test data:`, error instanceof Error ? error.message : error);
    }
    resetContainer();
  });

  describe("GET /api/v1/admin/settings", () => {
    it("should return default settings for admin user", async () => {
      const response = await app.request("/api/v1/admin/settings", {
        headers: { Authorization: `Bearer ${adminUserToken}` },
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        settings: {
          analytics: {
            enabled: boolean;
            provider: string | null;
            key: string | null;
            host: string | null;
          };
          search: {
            server_side: boolean;
            debounce_ms: number;
          };
        };
      };

      expect(data.settings).toBeDefined();
      expect(data.settings.analytics).toBeDefined();
      expect(data.settings.analytics.enabled).toBe(false);
      expect(data.settings.analytics.provider).toBeNull();
      expect(data.settings.analytics.key).toBeNull();
      expect(data.settings.analytics.host).toBeNull();
      expect(data.settings.search).toBeDefined();
      expect(data.settings.search.server_side).toBe(true);
      expect(data.settings.search.debounce_ms).toBe(300);
    });

    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/admin/settings");

      expect(response.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const response = await app.request("/api/v1/admin/settings", {
        headers: { Authorization: "Bearer invalid-token" },
      });

      expect(response.status).toBe(401);
    });

    it("should return 403 for non-admin user", async () => {
      const response = await app.request("/api/v1/admin/settings", {
        headers: { Authorization: `Bearer ${regularUserToken}` },
      });

      expect(response.status).toBe(403);
    });
  });

  describe("PATCH /api/v1/admin/settings", () => {
    it("should update analytics settings", async () => {
      const response = await app.request("/api/v1/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analytics: {
            enabled: true,
            provider: "umami",
            key: "test-key-123",
            host: "https://analytics.example.com",
          },
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        settings: {
          analytics: {
            enabled: boolean;
            provider: string | null;
            key: string | null;
            host: string | null;
          };
        };
      };

      expect(data.settings.analytics.enabled).toBe(true);
      expect(data.settings.analytics.provider).toBe("umami");
      expect(data.settings.analytics.key).toBe("test-key-123");
      expect(data.settings.analytics.host).toBe("https://analytics.example.com");
    });

    it("should update search settings", async () => {
      const response = await app.request("/api/v1/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search: {
            server_side: false,
            debounce_ms: 500,
          },
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        settings: {
          search: {
            server_side: boolean;
            debounce_ms: number;
          };
        };
      };

      expect(data.settings.search.server_side).toBe(false);
      expect(data.settings.search.debounce_ms).toBe(500);
    });

    it("should persist updated settings", async () => {
      // First update
      const updateResponse = await app.request("/api/v1/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analytics: {
            enabled: true,
            provider: "plausible",
          },
        }),
      });

      expect(updateResponse.status).toBe(200);

      // Then fetch
      const getResponse = await app.request("/api/v1/admin/settings", {
        headers: { Authorization: `Bearer ${adminUserToken}` },
      });

      const data = (await getResponse.json()) as {
        settings: {
          analytics: {
            enabled: boolean;
            provider: string | null;
          };
        };
      };

      expect(data.settings.analytics.enabled).toBe(true);
      expect(data.settings.analytics.provider).toBe("plausible");
    });

    it("should handle partial updates without affecting other fields", async () => {
      // First set known state
      const setupResponse = await app.request("/api/v1/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analytics: {
            enabled: true,
            provider: "umami",
            key: "original-key",
            host: "https://original.example.com",
          },
          search: {
            server_side: true,
            debounce_ms: 300,
          },
        }),
      });

      expect(setupResponse.status).toBe(200);

      // Update only analytics.enabled
      const response = await app.request("/api/v1/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analytics: {
            enabled: false,
          },
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        settings: {
          analytics: {
            enabled: boolean;
            provider: string | null;
            key: string | null;
            host: string | null;
          };
          search: {
            server_side: boolean;
            debounce_ms: number;
          };
        };
      };

      // Only analytics.enabled should change
      expect(data.settings.analytics.enabled).toBe(false);
      expect(data.settings.analytics.provider).toBe("umami");
      expect(data.settings.analytics.key).toBe("original-key");
      expect(data.settings.analytics.host).toBe("https://original.example.com");
      expect(data.settings.search.server_side).toBe(true);
      expect(data.settings.search.debounce_ms).toBe(300);
    });

    it("should return 400 for invalid analytics provider", async () => {
      const response = await app.request("/api/v1/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analytics: {
            provider: "invalid-provider",
          },
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid debounce_ms (out of range)", async () => {
      const response = await app.request("/api/v1/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search: {
            debounce_ms: 5000, // max is 2000
          },
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid analytics host URL", async () => {
      const response = await app.request("/api/v1/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analytics: {
            host: "not-a-valid-url",
          },
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should return 401 without token", async () => {
      const response = await app.request("/api/v1/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analytics: {
            enabled: true,
          },
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 403 for non-admin user", async () => {
      const response = await app.request("/api/v1/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${regularUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analytics: {
            enabled: true,
          },
        }),
      });

      expect(response.status).toBe(403);
    });

    it("should reject unknown fields", async () => {
      const response = await app.request("/api/v1/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unknown_field: "value",
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should reject empty body", async () => {
      const response = await app.request("/api/v1/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it("should allow setting provider to null", async () => {
      // First set a provider
      const setupResponse = await app.request("/api/v1/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analytics: {
            provider: "umami",
          },
        }),
      });

      expect(setupResponse.status).toBe(200);

      // Then set to null
      const response = await app.request("/api/v1/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analytics: {
            provider: null,
          },
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        settings: {
          analytics: {
            provider: string | null;
          };
        };
      };

      expect(data.settings.analytics.provider).toBeNull();
    });
  });
});
