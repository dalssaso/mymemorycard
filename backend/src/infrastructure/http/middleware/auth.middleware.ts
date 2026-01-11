import type { Context, Next } from "hono"
import { container } from "@/container"
import type { ITokenService } from "@/features/auth/services/token.service.interface"
import type { IUserRepository } from "@/features/auth/repositories/user.repository.interface"

/**
 * Authentication middleware for Hono
 * Extracts Bearer token, verifies it, fetches user, and sets in context
 * Returns 401 if authentication fails
 */
export function createAuthMiddleware() {
  // Resolve dependencies once at middleware creation time (avoid repeated resolution on each request)
  const tokenService = container.resolve<ITokenService>("ITokenService")
  const userRepository = container.resolve<IUserRepository>("IUserRepository")

  return async (c: Context, next: Next): Promise<Response | void> => {
    const authHeader = c.req.header("Authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized - Missing or invalid Authorization header" }, 401)
    }

    const token = authHeader.slice(7)

    const payload = tokenService.verifyToken(token)

    if (!payload) {
      return c.json({ error: "Unauthorized - Invalid or expired token" }, 401)
    }

    const user = await userRepository.findById(payload.userId)

    if (!user) {
      return c.json({ error: "Unauthorized - User not found" }, 401)
    }

    c.set("user", user)
    await next()
  }
}
