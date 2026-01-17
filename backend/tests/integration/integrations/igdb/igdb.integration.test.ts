import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import "reflect-metadata"
import { inArray } from "drizzle-orm"

import { registerDependencies, resetContainer, container } from "@/container"
import { createHonoApp } from "@/infrastructure/http/app"
import { DatabaseConnection } from "@/infrastructure/database/connection"
import { users, userApiCredentials } from "@/db/schema"
import type { IIgdbService } from "@/integrations/igdb"
import { IGDB_SERVICE_TOKEN } from "@/container/tokens"

describe("IGDB Integration Tests", () => {
  let app: ReturnType<typeof createHonoApp>
  let dbConnection: DatabaseConnection
  let igdbService: IIgdbService
  const createdUserIds: string[] = []
  let testUserToken: string
  let testUserId: string

  beforeAll(async () => {
    registerDependencies()
    app = createHonoApp()
    dbConnection = container.resolve(DatabaseConnection)
    igdbService = container.resolve<IIgdbService>(IGDB_SERVICE_TOKEN)

    // Create test user and get token
    const username = `igdbtest_${Date.now()}`
    const registerResponse = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email: `${username}@example.com`,
        password: "SecurePass123!",
      }),
    })

    if (!registerResponse.ok) {
      const errorBody = await registerResponse.text()
      throw new Error(`Failed to register test user: ${registerResponse.status} - ${errorBody}`)
    }

    const registerData = (await registerResponse.json()) as {
      user: { id: string }
      token: string
    }

    testUserId = registerData.user.id
    testUserToken = registerData.token
    createdUserIds.push(testUserId)
  })

  afterAll(async () => {
    try {
      // Clean up credentials first (foreign key constraint)
      if (createdUserIds.length > 0) {
        await dbConnection.db
          .delete(userApiCredentials)
          .where(inArray(userApiCredentials.userId, createdUserIds))
          .execute()
      }
      // Clean up test users
      if (createdUserIds.length > 0) {
        await dbConnection.db.delete(users).where(inArray(users.id, createdUserIds)).execute()
      }
    } catch (error) {
      console.error(`Error cleaning up test data:`, error instanceof Error ? error.message : error)
    }
    resetContainer()
  })

  describe("IgdbService resolution", () => {
    it("should resolve IgdbService from container", () => {
      expect(igdbService).toBeDefined()
      expect(typeof igdbService.searchGames).toBe("function")
      expect(typeof igdbService.getGameDetails).toBe("function")
      expect(typeof igdbService.authenticate).toBe("function")
    })
  })

  describe("Credential validation with IGDB", () => {
    beforeAll(async () => {
      // Save IGDB credentials for the test user
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
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Failed to save credentials: ${response.status} - ${errorBody}`)
      }
    })

    it("should validate IGDB credentials through API", async () => {
      // Note: This will fail with real Twitch validation since credentials are fake
      // In production, you'd use real credentials or mock the HTTP layer
      const response = await app.request("/api/v1/credentials/validate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testUserToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ service: "igdb" }),
      })

      // Should return 200 even if validation fails (valid = false in body)
      expect(response.status).toBe(200)

      const data = (await response.json()) as {
        service: string
        valid: boolean
        message: string
      }
      expect(data.service).toBe("igdb")
      // With fake credentials, this will be false
      expect(typeof data.valid).toBe("boolean")
    })
  })

  describe("IGDB service methods require credentials", () => {
    it("should throw NotFoundError when searching without credentials", async () => {
      // Create a new user without credentials
      const username = `igdbtest2_${Date.now()}`
      const registerResponse = await app.request("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email: `${username}@example.com`,
          password: "SecurePass123!",
        }),
      })

      const registerData = (await registerResponse.json()) as {
        user: { id: string }
      }
      const noCredUserId = registerData.user.id
      createdUserIds.push(noCredUserId)

      // Attempt to search without credentials
      await expect(igdbService.searchGames("witcher", noCredUserId)).rejects.toThrow()
    })
  })
})
