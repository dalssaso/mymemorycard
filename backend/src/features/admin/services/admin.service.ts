import { inject, injectable } from "tsyringe";

import { ADMIN_REPOSITORY_TOKEN } from "@/container/tokens";
import { Logger } from "@/infrastructure/logging/logger";

import type { IAdminRepository } from "../repositories/admin.repository.interface";
import type {
  AdminSetting,
  AdminSettingsResponse,
  AnalyticsProvider,
  UpdateAdminSettingsInput,
} from "../types";
import type { IAdminService } from "./admin.service.interface";

/**
 * Default settings when none stored in database
 */
const DEFAULT_SETTINGS: AdminSettingsResponse = {
  analytics: {
    enabled: false,
    provider: null,
    key: null,
    host: null,
  },
  search: {
    server_side: true,
    debounce_ms: 300,
  },
};

/**
 * Service layer for admin settings business logic
 */
@injectable()
export class AdminService implements IAdminService {
  constructor(
    @inject(ADMIN_REPOSITORY_TOKEN)
    private repository: IAdminRepository,
    @inject(Logger) private logger: Logger
  ) {
    this.logger = logger.child("AdminService");
  }

  /**
   * Get admin settings, returning defaults if none exist
   *
   * @returns Admin settings (or defaults)
   */
  async getSettings(): Promise<AdminSettingsResponse> {
    this.logger.debug("Fetching admin settings");

    const settings = await this.repository.findSettings();

    if (!settings) {
      this.logger.debug("No settings found, returning defaults");
      return DEFAULT_SETTINGS;
    }

    return this.mapToResponse(settings);
  }

  /**
   * Update admin settings (creates if not exists)
   *
   * @param data - Partial settings to update
   * @returns Updated settings
   */
  async updateSettings(data: UpdateAdminSettingsInput): Promise<AdminSettingsResponse> {
    this.logger.debug("Updating admin settings");

    const settings = await this.repository.upsert(data);

    return this.mapToResponse(settings);
  }

  /**
   * Convert internal AdminSetting type (camelCase) to API response type (snake_case)
   *
   * @param settings - Internal settings object with camelCase properties
   * @returns API response object with snake_case properties
   */
  private mapToResponse(settings: AdminSetting): AdminSettingsResponse {
    return {
      analytics: {
        enabled: settings.analyticsEnabled,
        provider: settings.analyticsProvider as AnalyticsProvider | null,
        key: settings.analyticsKey,
        host: settings.analyticsHost,
      },
      search: {
        server_side: settings.searchServerSide,
        debounce_ms: settings.searchDebounceMs,
      },
    };
  }
}
