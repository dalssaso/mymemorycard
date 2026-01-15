import type { UpdatePreferencesInput, UserPreference } from "../types"

/**
 * Repository interface for user preferences persistence
 */
export interface IPreferencesRepository {
  /**
   * Find preferences by user ID
   *
   * @param userId - User ID to find preferences for
   * @returns Preferences if found, null otherwise
   */
  findByUserId(userId: string): Promise<UserPreference | null>

  /**
   * Create or update preferences for a user (upsert)
   *
   * @param userId - User ID to create/update preferences for
   * @param data - Preferences data to save
   * @returns Created or updated preferences
   */
  upsert(userId: string, data: UpdatePreferencesInput): Promise<UserPreference>
}
