import type { Context, Next } from "hono"
import { HTTPException } from "hono/http-exception"

import type { AdminEnv } from "../controllers/admin.controller.interface"

/**
 * Middleware that requires the authenticated user to be an admin
 * Must be used AFTER the standard auth middleware
 */
export function requireAdmin() {
  return async (c: Context<AdminEnv>, next: Next): Promise<void> => {
    const user = c.get("user")

    if (!user) {
      throw new HTTPException(401, { message: "Authentication required" })
    }

    if (!user.isAdmin) {
      throw new HTTPException(403, { message: "Admin access required" })
    }

    await next()
  }
}
