import type { InferSelectModel } from "drizzle-orm";

import type { adminSettings } from "@/db/schema";

/**
 * Allowed values for analytics provider
 */
export type AnalyticsProvider = "umami" | "plausible" | "posthog" | "google-analytics";

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
