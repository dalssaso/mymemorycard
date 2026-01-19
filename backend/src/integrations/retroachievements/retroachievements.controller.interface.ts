import type { OpenAPIHono } from "@hono/zod-openapi";

import type { User } from "@/features/auth/types";

/**
 * Context variables for RetroAchievements integration routes.
 */
export type RAVariables = {
  user: User;
};

/**
 * Environment type for RetroAchievements controller.
 */
export type RAEnv = {
  Variables: RAVariables;
};

/**
 * Controller interface for RetroAchievements integration routes.
 */
export interface IRetroAchievementsController {
  readonly router: OpenAPIHono<RAEnv>;
}
