import type { PreferencesResponse, UpdatePreferencesInput } from "../types"

/**
 * Service interface for preferences business logic
 */
export interface IPreferencesService {
  /**
   * Get preferences for a user, returning defaults if none exist
   *
   * @param userId - User ID to get preferences for
   * @returns User preferences (or defaults)
   */
  getPreferences(userId: string): Promise<PreferencesResponse>

  /**
   * Update preferences for a user (creates if not exists)
   *
   * @param userId - User ID to update preferences for
   * @param data - Partial preferences to update
   * @returns Updated preferences
   */
  updatePreferences(userId: string, data: UpdatePreferencesInput): Promise<PreferencesResponse>
}
