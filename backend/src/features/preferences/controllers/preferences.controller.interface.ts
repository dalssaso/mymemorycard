import type { OpenAPIHono } from "@hono/zod-openapi";
import type { User } from "@/types";

/**
 * Variables available in preferences route context
 */
export type PreferencesVariables = {
  user: User;
};

/**
 * Environment type for preferences routes
 */
export type PreferencesEnv = {
  Variables: PreferencesVariables;
};

/**
 * Controller interface for preferences endpoints
 */
export interface IPreferencesController {
  /**
   * Hono router with OpenAPI support for preferences routes
   */
  router: OpenAPIHono<PreferencesEnv>;
}
