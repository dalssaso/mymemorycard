import "reflect-metadata"
import { beforeEach, describe, expect, it, mock } from "bun:test"

import type { DrizzleDB } from "@/infrastructure/database/connection"
import { PostgresPreferencesRepository } from "@/features/preferences/repositories/preferences.repository"
import type { UserPreference, UpdatePreferencesInput } from "@/features/preferences/types"

/**
 * Creates a mock DrizzleDB for preferences repository tests
 */
function createMockDrizzleDB(): DrizzleDB {
  return {
    select: mock().mockReturnValue({
      from: mock().mockReturnValue({
        where: mock().mockResolvedValue([]),
      }),
    }),
    insert: mock().mockReturnValue({
      values: mock().mockReturnValue({
        onConflictDoUpdate: mock().mockReturnValue({
          returning: mock().mockResolvedValue([]),
        }),
      }),
    }),
  } as unknown as DrizzleDB
}

/**
 * Mock select().from().where() chain with resolved result
 */
function mockSelectWhereResult<T>(mockDb: DrizzleDB, result: T[]): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      where: mock().mockResolvedValue(result),
    }),
  })
}

/**
 * Mock select().from().where() chain with rejected error
 */
function mockSelectWhereError(mockDb: DrizzleDB, error: Error): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      where: mock().mockRejectedValue(error),
    }),
  })
}

/**
 * Mock insert().values().onConflictDoUpdate().returning() chain with resolved result
 */
function mockUpsertResult<T>(mockDb: DrizzleDB, result: T[]): void {
  const insertMock = mockDb.insert as ReturnType<typeof mock>
  insertMock.mockReturnValue({
    values: mock().mockReturnValue({
      onConflictDoUpdate: mock().mockReturnValue({
        returning: mock().mockResolvedValue(result),
      }),
    }),
  })
}

/**
 * Mock insert().values().onConflictDoUpdate().returning() chain with rejected error
 */
function mockUpsertError(mockDb: DrizzleDB, error: Error): void {
  const insertMock = mockDb.insert as ReturnType<typeof mock>
  insertMock.mockReturnValue({
    values: mock().mockReturnValue({
      onConflictDoUpdate: mock().mockReturnValue({
        returning: mock().mockRejectedValue(error),
      }),
    }),
  })
}

describe("PostgresPreferencesRepository", () => {
  let repository: PostgresPreferencesRepository
  let mockDb: DrizzleDB

  beforeEach(() => {
    mockDb = createMockDrizzleDB()
    repository = new PostgresPreferencesRepository(mockDb)
  })

  describe("findByUserId", () => {
    it("returns null when no preferences found", async () => {
      mockSelectWhereResult(mockDb, [])

      const result = await repository.findByUserId("user-123")

      expect(result).toBeNull()
    })

    it("returns preferences when found", async () => {
      const preferences: UserPreference = {
        userId: "user-123",
        defaultView: "table",
        itemsPerPage: 50,
        theme: "light",
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      }

      mockSelectWhereResult(mockDb, [preferences])

      const result = await repository.findByUserId("user-123")

      expect(result).toEqual(preferences)
    })

    it("returns first result when multiple exist", async () => {
      const preferences: UserPreference[] = [
        {
          userId: "user-123",
          defaultView: "grid",
          itemsPerPage: 25,
          theme: "dark",
          updatedAt: new Date("2024-01-15T10:00:00Z"),
        },
        {
          userId: "user-123",
          defaultView: "table",
          itemsPerPage: 50,
          theme: "light",
          updatedAt: new Date("2024-01-14T10:00:00Z"),
        },
      ]

      mockSelectWhereResult(mockDb, preferences)

      const result = await repository.findByUserId("user-123")

      expect(result).toEqual(preferences[0])
    })

    it("propagates database errors", async () => {
      mockSelectWhereError(mockDb, new Error("connection timeout"))

      await expect(repository.findByUserId("user-123")).rejects.toThrow("connection timeout")
    })
  })

  describe("upsert", () => {
    it("creates preferences with provided values", async () => {
      const preferences: UserPreference = {
        userId: "user-123",
        defaultView: "table",
        itemsPerPage: 50,
        theme: "dark",
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      }

      mockUpsertResult(mockDb, [preferences])

      const input: UpdatePreferencesInput = {
        defaultView: "table",
        itemsPerPage: 50,
      }
      const result = await repository.upsert("user-123", input)

      expect(result).toEqual(preferences)
    })

    it("creates preferences with defaults when empty input", async () => {
      const preferences: UserPreference = {
        userId: "user-456",
        defaultView: "grid",
        itemsPerPage: 25,
        theme: "dark",
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      }

      mockUpsertResult(mockDb, [preferences])

      const result = await repository.upsert("user-456", {})

      expect(result).toEqual(preferences)
    })

    it("updates preferences with partial input", async () => {
      const preferences: UserPreference = {
        userId: "user-789",
        defaultView: "grid",
        itemsPerPage: 100,
        theme: "light",
        updatedAt: new Date("2024-01-15T12:00:00Z"),
      }

      mockUpsertResult(mockDb, [preferences])

      const input: UpdatePreferencesInput = {
        itemsPerPage: 100,
        theme: "light",
      }
      const result = await repository.upsert("user-789", input)

      expect(result).toEqual(preferences)
      expect(result.itemsPerPage).toBe(100)
      expect(result.theme).toBe("light")
    })

    it("propagates database errors", async () => {
      mockUpsertError(mockDb, new Error("constraint violation"))

      await expect(repository.upsert("user-123", { theme: "auto" })).rejects.toThrow(
        "constraint violation"
      )
    })
  })
})
