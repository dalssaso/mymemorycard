import type { Context, Next } from "hono";
import { container } from "@/container";
import type { ITokenService } from "@/features/auth/services/token.service.interface";
import type { IUserRepository } from "@/features/auth/repositories/user.repository.interface";
import { TOKEN_SERVICE_TOKEN, USER_REPOSITORY_TOKEN } from "@/container/tokens";

/**
 * Authentication middleware for Hono
 * Extracts Bearer token, verifies it, fetches user, and sets in context
 * Returns 401 if authentication fails
 */
export function createAuthMiddleware() {
  let tokenService: ITokenService | null = null;
  let userRepository: IUserRepository | null = null;

  const resolveDependencies = (): void => {
    if (!tokenService || !userRepository) {
      tokenService = container.resolve<ITokenService>(TOKEN_SERVICE_TOKEN);
      userRepository = container.resolve<IUserRepository>(USER_REPOSITORY_TOKEN);
    }
  };

  return async (c: Context, next: Next): Promise<Response | void> => {
    resolveDependencies();
    if (!tokenService || !userRepository) {
      throw new Error("Auth middleware dependencies not registered");
    }

    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.slice(7);

    const payload = tokenService.verifyToken(token);

    if (!payload) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const user = await userRepository.findById(payload.userId);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("user", user);
    await next();
  };
}
