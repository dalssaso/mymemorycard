import { injectable, inject } from "tsyringe"

import { PREFERENCES_REPOSITORY_TOKEN } from "@/container/tokens"
import { Logger } from "@/infrastructure/logging/logger"
import type { IPreferencesRepository } from "../repositories/preferences.repository.interface"
import type { PreferencesResponse, UpdatePreferencesInput, UserPreference } from "../types"

import type { IPreferencesService } from "./preferences.service.interface"

/**
 * Default preferences when user has none stored
 */
const DEFAULT_PREFERENCES: PreferencesResponse = {
  default_view: "grid",
  items_per_page: 25,
  theme: "dark",
  updated_at: null,
}

/**
 * Service layer for preferences business logic
 */
@injectable()
export class PreferencesService implements IPreferencesService {
  constructor(
    @inject(PREFERENCES_REPOSITORY_TOKEN)
    private repository: IPreferencesRepository,
    @inject(Logger) private logger: Logger
  ) {
    this.logger = logger.child("PreferencesService")
  }

  /**
   * Get preferences for a user, returning defaults if none exist
   *
   * @param userId - User ID to get preferences for
   * @returns User preferences (or defaults)
   */
  async getPreferences(userId: string): Promise<PreferencesResponse> {
    this.logger.debug(`Fetching preferences for user ${userId}`)

    const preferences = await this.repository.findByUserId(userId)

    if (!preferences) {
      this.logger.debug(`No preferences found for user ${userId}, returning defaults`)
      return DEFAULT_PREFERENCES
    }

    return this.mapToResponse(preferences)
  }

  /**
   * Update preferences for a user (creates if not exists)
   *
   * @param userId - User ID to update preferences for
   * @param data - Partial preferences to update
   * @returns Updated preferences
   */
  async updatePreferences(
    userId: string,
    data: UpdatePreferencesInput
  ): Promise<PreferencesResponse> {
    this.logger.debug(`Updating preferences for user ${userId}`)

    const preferences = await this.repository.upsert(userId, data)

    return this.mapToResponse(preferences)
  }

  /**
   * Convert internal UserPreference type (camelCase) to API response type (snake_case)
   *
   * @param preferences - Internal preferences object with camelCase properties
   * @returns API response object with snake_case properties
   */
  private mapToResponse(preferences: UserPreference): PreferencesResponse {
    return {
      default_view: preferences.defaultView ?? "grid",
      items_per_page: preferences.itemsPerPage ?? 25,
      theme: preferences.theme ?? "dark",
      updated_at: preferences.updatedAt ? (preferences.updatedAt as Date).toISOString() : null,
    }
  }
}
