import type { OpenAPIHono } from "@hono/zod-openapi";
import type { User } from "@/types";

export type UserPlatformsVariables = {
  user: User;
};

export type UserPlatformsEnv = {
  Variables: UserPlatformsVariables;
};

/**
 * Controller for user-platforms routes
 */
export interface IUserPlatformsController {
  /**
   * Hono router instance with all routes registered
   */
  router: OpenAPIHono<UserPlatformsEnv>;
}
