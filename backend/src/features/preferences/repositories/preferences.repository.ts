import { injectable, inject } from "tsyringe";
import { eq } from "drizzle-orm";

import { DATABASE_TOKEN } from "@/container/tokens";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import { userPreferences } from "@/db/schema";

import type { UserPreference, UpdatePreferencesInput } from "../types";
import type { IPreferencesRepository } from "./preferences.repository.interface";

/**
 * PostgreSQL implementation of preferences repository using Drizzle ORM
 */
@injectable()
export class PostgresPreferencesRepository implements IPreferencesRepository {
  constructor(@inject(DATABASE_TOKEN) private db: DrizzleDB) {}

  /**
   * Find preferences by user ID
   *
   * @param userId - User ID to find preferences for
   * @returns Preferences if found, null otherwise
   */
  async findByUserId(userId: string): Promise<UserPreference | null> {
    const results = await this.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));

    return results[0] ?? null;
  }

  /**
   * Create or update preferences for a user (upsert)
   *
   * @param userId - User ID to create/update preferences for
   * @param data - Preferences data to save
   * @returns Created or updated preferences
   */
  async upsert(userId: string, data: UpdatePreferencesInput): Promise<UserPreference> {
    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.defaultView !== undefined) {
      updateValues.defaultView = data.defaultView;
    }
    if (data.itemsPerPage !== undefined) {
      updateValues.itemsPerPage = data.itemsPerPage;
    }
    if (data.theme !== undefined) {
      updateValues.theme = data.theme;
    }

    const result = await this.db
      .insert(userPreferences)
      .values({
        userId,
        defaultView: data.defaultView ?? "grid",
        itemsPerPage: data.itemsPerPage ?? 25,
        theme: data.theme ?? "dark",
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: updateValues,
      })
      .returning();

    return result[0];
  }
}
