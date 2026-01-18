import type { OpenAPIHono } from "@hono/zod-openapi";

import type { User } from "@/features/auth/types";

/**
 * Context variables for Achievement routes.
 */
export type AchievementVariables = {
  user: User;
};

/**
 * Environment type for Achievement controller.
 */
export type AchievementEnv = {
  Variables: AchievementVariables;
};

/**
 * Controller interface for Achievement routes.
 */
export interface IAchievementController {
  readonly router: OpenAPIHono<AchievementEnv>;
}
