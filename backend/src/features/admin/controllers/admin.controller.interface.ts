import type { OpenAPIHono } from "@hono/zod-openapi"

import type { User } from "@/types"

/**
 * Variables available in admin route context
 */
export type AdminVariables = {
  user: User
  requestId: string
}

/**
 * Environment type for admin routes
 */
export type AdminEnv = {
  Variables: AdminVariables
}

/**
 * Controller interface for admin endpoints
 */
export interface IAdminController {
  /**
   * Hono router with OpenAPI support for admin routes
   */
  router: OpenAPIHono<AdminEnv>
}
