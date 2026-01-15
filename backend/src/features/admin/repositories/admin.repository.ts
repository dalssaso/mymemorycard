import { inject, injectable } from "tsyringe"

import { DATABASE_TOKEN } from "@/container/tokens"
import { adminSettings } from "@/db/schema"
import type { DrizzleDB } from "@/infrastructure/database/connection"

import type { AdminSetting, UpdateAdminSettingsInput } from "../types"
import type { IAdminRepository } from "./admin.repository.interface"

/**
 * PostgreSQL implementation of admin repository using Drizzle ORM
 */
@injectable()
export class PostgresAdminRepository implements IAdminRepository {
  constructor(@inject(DATABASE_TOKEN) private db: DrizzleDB) {}

  /**
   * Get the singleton admin settings row
   *
   * @returns Admin settings if found, null otherwise
   */
  async findSettings(): Promise<AdminSetting | null> {
    const results = await this.db.select().from(adminSettings).limit(1)

    return results[0] ?? null
  }

  /**
   * Create or update admin settings (upsert singleton)
   *
   * @param data - Settings data to save
   * @returns Created or updated settings
   */
  async upsert(data: UpdateAdminSettingsInput): Promise<AdminSetting> {
    const existing = await this.findSettings()

    if (existing) {
      const updateValues: Record<string, unknown> = {
        updatedAt: new Date(),
      }

      if (data.analyticsEnabled !== undefined) {
        updateValues.analyticsEnabled = data.analyticsEnabled
      }
      if (data.analyticsProvider !== undefined) {
        updateValues.analyticsProvider = data.analyticsProvider
      }
      if (data.analyticsKey !== undefined) {
        updateValues.analyticsKey = data.analyticsKey
      }
      if (data.analyticsHost !== undefined) {
        updateValues.analyticsHost = data.analyticsHost
      }
      if (data.searchServerSide !== undefined) {
        updateValues.searchServerSide = data.searchServerSide
      }
      if (data.searchDebounceMs !== undefined) {
        updateValues.searchDebounceMs = data.searchDebounceMs
      }

      const result = await this.db
        .update(adminSettings)
        .set(updateValues)
        .returning()

      if (!result || result.length === 0) {
        throw new Error("Update did not return a row")
      }

      return result[0]
    }

    // Create new row with defaults
    const result = await this.db
      .insert(adminSettings)
      .values({
        analyticsEnabled: data.analyticsEnabled ?? false,
        analyticsProvider: data.analyticsProvider ?? null,
        analyticsKey: data.analyticsKey ?? null,
        analyticsHost: data.analyticsHost ?? null,
        searchServerSide: data.searchServerSide ?? true,
        searchDebounceMs: data.searchDebounceMs ?? 300,
        updatedAt: new Date(),
      })
      .returning()

    if (!result || result.length === 0) {
      throw new Error("Insert did not return a row")
    }

    return result[0]
  }
}
