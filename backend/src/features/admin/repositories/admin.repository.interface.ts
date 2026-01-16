import type { AdminSetting, UpdateAdminSettingsInput } from "../types";

/**
 * Repository interface for admin settings persistence
 */
export interface IAdminRepository {
  /**
   * Get the singleton admin settings row
   *
   * @returns Admin settings if found, null otherwise
   */
  findSettings(): Promise<AdminSetting | null>;

  /**
   * Create or update admin settings (upsert singleton)
   *
   * @param data - Settings data to save
   * @returns Created or updated settings
   */
  upsert(data: UpdateAdminSettingsInput): Promise<AdminSetting>;
}
