import type { AdminSettingsResponse, UpdateAdminSettingsInput } from "../types"

/**
 * Service interface for admin settings business logic
 */
export interface IAdminService {
  /**
   * Get admin settings, returning defaults if none exist
   *
   * @returns Admin settings (or defaults)
   */
  getSettings(): Promise<AdminSettingsResponse>

  /**
   * Update admin settings (creates if not exists)
   *
   * @param data - Partial settings to update
   * @returns Updated settings
   */
  updateSettings(data: UpdateAdminSettingsInput): Promise<AdminSettingsResponse>
}
