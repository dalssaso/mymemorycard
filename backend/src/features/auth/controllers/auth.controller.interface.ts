import type { OpenAPIHono } from "@hono/zod-openapi";
import type { User } from "@/types";

export type AuthEnv = {
  Variables: {
    user: User;
  };
};

/**
 * Interface for AuthController
 * Defines the public contract for authentication route management
 */
export interface IAuthController {
  /**
   * OpenAPI Hono router with registered authentication endpoints
   * - POST /register - Register new user
   * - POST /login - Authenticate user
   */
  router: OpenAPIHono<AuthEnv>;
}
