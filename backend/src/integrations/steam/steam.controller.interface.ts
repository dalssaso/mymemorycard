import type { OpenAPIHono } from "@hono/zod-openapi"

import type { User } from "@/features/auth/types"

/**
 * Context variables for Steam integration routes.
 */
export type SteamVariables = {
  user: User
}

/**
 * Environment type for Steam controller.
 */
export type SteamEnv = {
  Variables: SteamVariables
}

/**
 * Controller interface for Steam integration routes.
 */
export interface ISteamController {
  readonly router: OpenAPIHono<SteamEnv>
}
