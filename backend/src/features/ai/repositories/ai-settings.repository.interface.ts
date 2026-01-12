import type { GatewayConfig, UserAiSettings } from "../types";

/**
 * Repository interface for managing user AI settings and gateway configuration.
 */
export interface IAiSettingsRepository {
  /**
   * Find AI settings for a user by their ID.
   *
   * @param userId - The user's unique identifier
   * @returns The user's AI settings, or null if not found
   */
  findByUserId(userId: string): Promise<UserAiSettings | null>;

  /**
   * Save or update AI settings for a user.
   *
   * @param settings - The AI settings to save (userId and provider are required)
   * @returns A promise that resolves when the settings are saved
   */
  save(settings: Partial<UserAiSettings> & { userId: string }): Promise<void>;

  /**
   * Get gateway configuration for the user, if configured.
   *
   * @param userId - The user's unique identifier
   * @returns Gateway config with provider and apiKey, or null if not configured
   */
  getGatewayConfig(userId: string): Promise<GatewayConfig | null>;
}
