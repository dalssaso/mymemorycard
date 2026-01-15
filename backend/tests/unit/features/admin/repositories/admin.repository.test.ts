import { beforeEach, describe, expect, it, mock } from "bun:test"
import "reflect-metadata"

import { PostgresAdminRepository } from "@/features/admin/repositories/admin.repository"
import type { AdminSetting } from "@/features/admin/types"
import type { DrizzleDB } from "@/infrastructure/database/connection"
import { createMockDrizzleDB } from "@/tests/helpers/drizzle.mocks"

/**
 * Mock a successful select().from().limit() chain with a resolved result.
 */
function mockSelectLimitResult<T>(mockDb: DrizzleDB, result: T[]): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      limit: mock().mockResolvedValue(result),
    }),
  })
}

/**
 * Mock a failed select().from().limit() chain with a rejected error.
 */
function mockSelectLimitError(mockDb: DrizzleDB, error: Error): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      limit: mock().mockRejectedValue(error),
    }),
  })
}

/**
 * Mock both select (returning existing) and update().set().returning() chain for update path.
 */
function mockUpdateResult<T>(mockDb: DrizzleDB, existing: T, updated: T): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      limit: mock().mockResolvedValue([existing]),
    }),
  })
  ;(mockDb as unknown as { update: ReturnType<typeof mock> }).update = mock().mockReturnValue({
    set: mock().mockReturnValue({
      returning: mock().mockResolvedValue([updated]),
    }),
  })
}

/**
 * Mock select returning empty and insert().values().returning() chain for create path.
 */
function mockInsertResult<T>(mockDb: DrizzleDB, result: T): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      limit: mock().mockResolvedValue([]),
    }),
  })
  ;(mockDb as unknown as { insert: ReturnType<typeof mock> }).insert = mock().mockReturnValue({
    values: mock().mockReturnValue({
      returning: mock().mockResolvedValue([result]),
    }),
  })
}

/**
 * Mock update chain that returns empty array (error case).
 */
function mockUpdateEmptyResult<T>(mockDb: DrizzleDB, existing: T): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      limit: mock().mockResolvedValue([existing]),
    }),
  })
  ;(mockDb as unknown as { update: ReturnType<typeof mock> }).update = mock().mockReturnValue({
    set: mock().mockReturnValue({
      returning: mock().mockResolvedValue([]),
    }),
  })
}

/**
 * Mock insert chain that returns empty array (error case).
 */
function mockInsertEmptyResult(mockDb: DrizzleDB): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      limit: mock().mockResolvedValue([]),
    }),
  })
  ;(mockDb as unknown as { insert: ReturnType<typeof mock> }).insert = mock().mockReturnValue({
    values: mock().mockReturnValue({
      returning: mock().mockResolvedValue([]),
    }),
  })
}

/**
 * Mock update chain that throws an error.
 */
function mockUpdateError<T>(mockDb: DrizzleDB, existing: T, error: Error): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      limit: mock().mockResolvedValue([existing]),
    }),
  })
  ;(mockDb as unknown as { update: ReturnType<typeof mock> }).update = mock().mockReturnValue({
    set: mock().mockReturnValue({
      returning: mock().mockRejectedValue(error),
    }),
  })
}

/**
 * Mock insert chain that throws an error.
 */
function mockInsertError(mockDb: DrizzleDB, error: Error): void {
  const selectMock = mockDb.select as ReturnType<typeof mock>
  selectMock.mockReturnValue({
    from: mock().mockReturnValue({
      limit: mock().mockResolvedValue([]),
    }),
  })
  ;(mockDb as unknown as { insert: ReturnType<typeof mock> }).insert = mock().mockReturnValue({
    values: mock().mockReturnValue({
      returning: mock().mockRejectedValue(error),
    }),
  })
}

describe("PostgresAdminRepository", () => {
  let repository: PostgresAdminRepository
  let mockDb: DrizzleDB

  beforeEach(() => {
    mockDb = createMockDrizzleDB()
    repository = new PostgresAdminRepository(mockDb)
  })

  describe("findSettings", () => {
    it("returns null when no settings exist", async () => {
      mockSelectLimitResult(mockDb, [])

      const result = await repository.findSettings()

      expect(result).toBeNull()
    })

    it("returns settings when they exist", async () => {
      const settings: AdminSetting = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        analyticsEnabled: true,
        analyticsProvider: "umami",
        analyticsKey: "test-key",
        analyticsHost: "https://analytics.example.com",
        searchServerSide: false,
        searchDebounceMs: 500,
        updatedAt: new Date("2026-01-15T10:00:00Z"),
      }

      mockSelectLimitResult(mockDb, [settings])

      const result = await repository.findSettings()

      expect(result).toEqual(settings)
    })

    it("propagates database errors", async () => {
      mockSelectLimitError(mockDb, new Error("connection timeout"))

      await expect(repository.findSettings()).rejects.toThrow("connection timeout")
    })
  })

  describe("upsert", () => {
    it("creates new settings when none exist", async () => {
      const newSettings: AdminSetting = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        analyticsEnabled: true,
        analyticsProvider: "plausible",
        analyticsKey: "new-key",
        analyticsHost: "https://plausible.example.com",
        searchServerSide: true,
        searchDebounceMs: 300,
        updatedAt: new Date("2026-01-15T11:00:00Z"),
      }

      mockInsertResult(mockDb, newSettings)

      const result = await repository.upsert({
        analyticsEnabled: true,
        analyticsProvider: "plausible",
        analyticsKey: "new-key",
        analyticsHost: "https://plausible.example.com",
      })

      expect(result).toEqual(newSettings)
    })

    it("updates existing settings", async () => {
      const existing: AdminSetting = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        analyticsEnabled: false,
        analyticsProvider: null,
        analyticsKey: null,
        analyticsHost: null,
        searchServerSide: true,
        searchDebounceMs: 300,
        updatedAt: new Date("2026-01-15T10:00:00Z"),
      }

      const updated: AdminSetting = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        analyticsEnabled: true,
        analyticsProvider: "umami",
        analyticsKey: "updated-key",
        analyticsHost: "https://analytics.example.com",
        searchServerSide: true,
        searchDebounceMs: 300,
        updatedAt: new Date("2026-01-15T12:00:00Z"),
      }

      mockUpdateResult(mockDb, existing, updated)

      const result = await repository.upsert({
        analyticsEnabled: true,
        analyticsProvider: "umami",
        analyticsKey: "updated-key",
        analyticsHost: "https://analytics.example.com",
      })

      expect(result).toEqual(updated)
    })

    it("handles partial updates", async () => {
      const existing: AdminSetting = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        analyticsEnabled: false,
        analyticsProvider: null,
        analyticsKey: null,
        analyticsHost: null,
        searchServerSide: true,
        searchDebounceMs: 300,
        updatedAt: new Date("2026-01-15T10:00:00Z"),
      }

      const updated: AdminSetting = {
        ...existing,
        searchDebounceMs: 500,
        updatedAt: new Date("2026-01-15T12:00:00Z"),
      }

      mockUpdateResult(mockDb, existing, updated)

      const result = await repository.upsert({ searchDebounceMs: 500 })

      expect(result.searchDebounceMs).toBe(500)
    })

    it("throws error when update returns empty array", async () => {
      const existing: AdminSetting = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        analyticsEnabled: false,
        analyticsProvider: null,
        analyticsKey: null,
        analyticsHost: null,
        searchServerSide: true,
        searchDebounceMs: 300,
        updatedAt: new Date("2026-01-15T10:00:00Z"),
      }

      mockUpdateEmptyResult(mockDb, existing)

      await expect(repository.upsert({ analyticsEnabled: true })).rejects.toThrow(
        "Update did not return a row"
      )
    })

    it("throws error when insert returns empty array", async () => {
      mockInsertEmptyResult(mockDb)

      await expect(repository.upsert({ analyticsEnabled: true })).rejects.toThrow(
        "Insert did not return a row"
      )
    })

    it("propagates database errors on update", async () => {
      const existing: AdminSetting = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        analyticsEnabled: false,
        analyticsProvider: null,
        analyticsKey: null,
        analyticsHost: null,
        searchServerSide: true,
        searchDebounceMs: 300,
        updatedAt: new Date("2026-01-15T10:00:00Z"),
      }

      mockUpdateError(mockDb, existing, new Error("constraint violation"))

      await expect(repository.upsert({ analyticsEnabled: true })).rejects.toThrow(
        "constraint violation"
      )
    })

    it("propagates database errors on insert", async () => {
      mockInsertError(mockDb, new Error("constraint violation"))

      await expect(repository.upsert({ analyticsEnabled: true })).rejects.toThrow(
        "constraint violation"
      )
    })
  })
})
