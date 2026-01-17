import type { OpenAPIHono } from "@hono/zod-openapi"

import type { User } from "@/features/auth/types"

/**
 * Context variables for credential routes.
 */
export type CredentialVariables = {
  user: User
}

/**
 * Environment type for credential controller.
 */
export type CredentialEnv = {
  Variables: CredentialVariables
}

/**
 * Controller interface for credential routes.
 */
export interface ICredentialController {
  readonly router: OpenAPIHono<CredentialEnv>
}
