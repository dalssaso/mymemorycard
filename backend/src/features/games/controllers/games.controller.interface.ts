import type { OpenAPIHono } from "@hono/zod-openapi";

import type { User } from "@/types";

/**
 * Variables available in games route context
 */
export type GamesVariables = {
  user: User;
  requestId: string;
};

/**
 * Environment type for games routes
 */
export type GamesEnv = {
  Variables: GamesVariables;
};

/**
 * Controller interface for games endpoints
 */
export interface IGamesController {
  /**
   * Hono router with OpenAPI support for games routes
   */
  router: OpenAPIHono<GamesEnv>;
}
