import type { InferSelectModel } from "drizzle-orm";

import type { userPreferences } from "@/db/schema";

/**
 * Allowed values for default view
 */
export type DefaultView = "grid" | "table";

/**
 * Allowed values for items per page
 */
export type ItemsPerPage = 10 | 25 | 50 | 100;

/**
 * Allowed values for theme
 */
export type Theme = "light" | "dark" | "auto";

/**
 * Database model type for user preferences
 */
export type UserPreference = InferSelectModel<typeof userPreferences>;

/**
 * Input type for updating preferences
 */
export interface UpdatePreferencesInput {
  defaultView?: DefaultView;
  itemsPerPage?: ItemsPerPage;
  theme?: Theme;
}

/**
 * API response type (snake_case)
 */
export interface PreferencesResponse {
  default_view: DefaultView;
  items_per_page: ItemsPerPage;
  theme: Theme;
  updated_at: string | null;
}
