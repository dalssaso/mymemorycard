import type { OpenAPIHono } from "@hono/zod-openapi";
import type { User } from "@/types";

export type PlatformVariables = {
  user: User;
};

export type PlatformEnv = {
  Variables: PlatformVariables;
};

/**
 * Interface for PlatformController
 * Defines the public contract for platform route management
 */
export interface IPlatformController {
  /**
   * OpenAPI Hono router with registered platform endpoints
   * - GET / - List platforms
   * - GET /:id - Get platform
   */
  router: OpenAPIHono<PlatformEnv>;
}
