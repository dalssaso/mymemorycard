import jwt from "jsonwebtoken";
import type { JWTPayload, User } from "@/types";
import { queryOne } from "@/services/db";
import { container } from "@/container";
import type { IConfig } from "@/infrastructure/config/config.interface";

/**
 * Generates a JWT token for the given payload.
 *
 * @param payload - The JWT payload containing userId and username
 * @returns Signed JWT token string valid for 7 days
 */
export function generateToken(payload: JWTPayload): string {
  const config = container.resolve<IConfig>("IConfig");
  return jwt.sign(payload, config.jwt.secret, { expiresIn: "7d" });
}

/**
 * Verifies and decodes a JWT token.
 *
 * @param token - The JWT token string to verify
 * @returns The decoded payload if valid, null otherwise
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const config = container.resolve<IConfig>("IConfig");
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Authenticates a request by extracting and verifying the Bearer token.
 *
 * @param req - The incoming HTTP request
 * @returns The authenticated User if valid, null otherwise
 */
export async function authenticate(req: Request): Promise<User | null> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  // Fetch user from database
  const user = await queryOne<User>(
    `SELECT id, username, email,
            password_hash as "passwordHash",
            created_at as "createdAt",
            updated_at as "updatedAt"
     FROM users WHERE id = $1`,
    [payload.userId]
  );

  return user;
}

/**
 * Higher-order function that wraps a route handler to require authentication.
 * Returns 401 Unauthorized if the request is not authenticated.
 *
 * @param handler - The route handler that requires an authenticated user
 * @returns A wrapped handler that performs authentication before calling the original
 */
export function requireAuth(
  handler: (req: Request, user: User, params?: Record<string, string>) => Promise<Response>
) {
  return async (req: Request, params?: Record<string, string>): Promise<Response> => {
    const user = await authenticate(req);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return handler(req, user, params);
  };
}
