import type { InferSelectModel } from "drizzle-orm";

import { analyticsProviderEnum, type adminSettings } from "@/db/schema";

/**
 * Allowed values for analytics provider, derived from DB enum
 */
export const ANALYTICS_PROVIDER_VALUES = analyticsProviderEnum.enumValues;

/**
 * Analytics provider type derived from DB enum
 */
export type AnalyticsProvider = (typeof ANALYTICS_PROVIDER_VALUES)[number];

/**
 * Database model type for admin settings
 */
export type AdminSetting = InferSelectModel<typeof adminSettings>;

/**
 * Input type for updating admin settings
 */
export interface UpdateAdminSettingsInput {
  analyticsEnabled?: boolean;
  analyticsProvider?: AnalyticsProvider | null;
  analyticsKey?: string | null;
  analyticsHost?: string | null;
  searchServerSide?: boolean;
  searchDebounceMs?: number;
}

/**
 * Analytics configuration response (snake_case)
 */
export interface AnalyticsConfigResponse {
  enabled: boolean;
  provider: AnalyticsProvider | null;
  key: string | null;
  host: string | null;
}

/**
 * Search configuration response (snake_case)
 */
export interface SearchConfigResponse {
  server_side: boolean;
  debounce_ms: number;
}

/**
 * API response type (snake_case)
 */
export interface AdminSettingsResponse {
  analytics: AnalyticsConfigResponse;
  search: SearchConfigResponse;
}
