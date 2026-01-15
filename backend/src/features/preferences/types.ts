import type { InferSelectModel } from "drizzle-orm";

import type { userPreferences } from "@/db/schema";

/**
 * Database model type for user preferences
 */
export type UserPreference = InferSelectModel<typeof userPreferences>;

/**
 * Input type for updating preferences
 */
export interface UpdatePreferencesInput {
  defaultView?: "grid" | "table";
  itemsPerPage?: 10 | 25 | 50 | 100;
  theme?: "light" | "dark" | "auto";
}

/**
 * API response type (snake_case)
 */
export interface PreferencesResponse {
  default_view: string;
  items_per_page: number;
  theme: string;
  updated_at: string | null;
}
