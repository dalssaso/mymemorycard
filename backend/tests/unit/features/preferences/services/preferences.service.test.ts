import { beforeEach, describe, expect, it } from "bun:test"
import "reflect-metadata"
import { PreferencesService } from "@/features/preferences/services/preferences.service"
import type { IPreferencesRepository } from "@/features/preferences/repositories/preferences.repository.interface"
import type { UserPreference } from "@/features/preferences/types"
import { createMockLogger } from "@/tests/helpers/repository.mocks"

const createMockRepository = (): IPreferencesRepository => ({
  findByUserId: async () => null,
  upsert: async () =>
    ({
      userId: "user-123",
      defaultView: "grid",
      itemsPerPage: 25,
      theme: "dark",
      updatedAt: new Date("2026-01-15T10:00:00Z"),
    }) as UserPreference,
})

describe("PreferencesService", () => {
  let service: PreferencesService
  let mockRepository: IPreferencesRepository
  const testUserId = "user-123"

  beforeEach(() => {
    mockRepository = createMockRepository()
    service = new PreferencesService(mockRepository, createMockLogger())
  })

  describe("getPreferences", () => {
    it("should return defaults when no preferences exist", async () => {
      const result = await service.getPreferences(testUserId)

      expect(result).toEqual({
        default_view: "grid",
        items_per_page: 25,
        theme: "dark",
        updated_at: null,
      })
    })

    it("should return stored preferences when they exist", async () => {
      const storedPreferences: UserPreference = {
        userId: testUserId,
        defaultView: "table",
        itemsPerPage: 50,
        theme: "light",
        updatedAt: new Date("2026-01-15T10:00:00Z"),
      }

      mockRepository.findByUserId = async () => storedPreferences

      const result = await service.getPreferences(testUserId)

      expect(result).toEqual({
        default_view: "table",
        items_per_page: 50,
        theme: "light",
        updated_at: "2026-01-15T10:00:00.000Z",
      })
    })

    it("should convert camelCase to snake_case correctly", async () => {
      const storedPreferences: UserPreference = {
        userId: testUserId,
        defaultView: "grid",
        itemsPerPage: 100,
        theme: "auto",
        updatedAt: new Date("2026-01-15T12:30:00Z"),
      }

      mockRepository.findByUserId = async () => storedPreferences

      const result = await service.getPreferences(testUserId)

      // Verify snake_case conversion
      expect("default_view" in result).toBe(true)
      expect("items_per_page" in result).toBe(true)
      expect("updated_at" in result).toBe(true)
      // Verify camelCase is not present
      expect("defaultView" in result).toBe(false)
      expect("itemsPerPage" in result).toBe(false)
      expect("updatedAt" in result).toBe(false)
    })

    it("should handle null updatedAt as null in response", async () => {
      const storedPreferences: UserPreference = {
        userId: testUserId,
        defaultView: "grid",
        itemsPerPage: 25,
        theme: "dark",
        updatedAt: null,
      }

      mockRepository.findByUserId = async () => storedPreferences

      const result = await service.getPreferences(testUserId)

      expect(result.updated_at).toBeNull()
    })

    it("should use default values for null preference fields", async () => {
      const storedPreferences: UserPreference = {
        userId: testUserId,
        defaultView: null,
        itemsPerPage: null,
        theme: null,
        updatedAt: new Date("2026-01-15T10:00:00Z"),
      }

      mockRepository.findByUserId = async () => storedPreferences

      const result = await service.getPreferences(testUserId)

      expect(result.default_view).toBe("grid")
      expect(result.items_per_page).toBe(25)
      expect(result.theme).toBe("dark")
    })
  })

  describe("updatePreferences", () => {
    it("should update and return preferences", async () => {
      const updatedPreferences: UserPreference = {
        userId: testUserId,
        defaultView: "table",
        itemsPerPage: 50,
        theme: "light",
        updatedAt: new Date("2026-01-15T11:00:00Z"),
      }

      mockRepository.upsert = async () => updatedPreferences

      const result = await service.updatePreferences(testUserId, {
        defaultView: "table",
        theme: "light",
      })

      expect(result.default_view).toBe("table")
      expect(result.theme).toBe("light")
      expect(result.items_per_page).toBe(50)
    })

    it("should handle partial updates", async () => {
      let capturedData: unknown

      mockRepository.upsert = async (_userId, data) => {
        capturedData = data
        return {
          userId: testUserId,
          defaultView: "grid",
          itemsPerPage: 100,
          theme: "dark",
          updatedAt: new Date("2026-01-15T11:00:00Z"),
        } as UserPreference
      }

      await service.updatePreferences(testUserId, { itemsPerPage: 100 })

      expect(capturedData).toEqual({ itemsPerPage: 100 })
    })

    it("should call repository.upsert with correct arguments", async () => {
      let capturedUserId: string | undefined
      let capturedData: unknown

      mockRepository.upsert = async (userId, data) => {
        capturedUserId = userId
        capturedData = data
        return {
          userId,
          defaultView: "table",
          itemsPerPage: 25,
          theme: "dark",
          updatedAt: new Date(),
        } as UserPreference
      }

      await service.updatePreferences(testUserId, {
        defaultView: "table",
      })

      expect(capturedUserId).toBe(testUserId)
      expect(capturedData).toEqual({ defaultView: "table" })
    })

    it("should return mapped response with snake_case fields", async () => {
      mockRepository.upsert = async () =>
        ({
          userId: testUserId,
          defaultView: "grid",
          itemsPerPage: 25,
          theme: "auto",
          updatedAt: new Date("2026-01-15T10:00:00Z"),
        }) as UserPreference

      const result = await service.updatePreferences(testUserId, { theme: "auto" })

      // Verify snake_case fields
      expect("default_view" in result).toBe(true)
      expect("items_per_page" in result).toBe(true)
      expect("updated_at" in result).toBe(true)
      expect(result.theme).toBe("auto")
    })
  })
})
