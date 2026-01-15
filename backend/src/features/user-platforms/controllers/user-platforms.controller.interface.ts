import type { OpenAPIHono } from "@hono/zod-openapi";

/**
 * Controller for user-platforms routes
 */
export interface IUserPlatformsController {
  /**
   * Hono router instance with all routes registered
   */
  router: OpenAPIHono<any>;
}
