import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

const VITE_DEFAULT_ORIGIN = "http://localhost:5173";

/**
 * Validates ORIGIN environment variable using URL constructor.
 * Falls back to Vite dev server default if parsing fails.
 */
function getValidatedOrigin(): string {
  if (!process.env.ORIGIN) {
    return VITE_DEFAULT_ORIGIN;
  }

  try {
    // Validate that ORIGIN is a valid URL
    new URL(process.env.ORIGIN);
    return process.env.ORIGIN;
  } catch {
    console.warn(
      `Invalid ORIGIN value: "${process.env.ORIGIN}". ` +
        `Must be a valid URL. Falling back to default: "${VITE_DEFAULT_ORIGIN}"`
    );
    return VITE_DEFAULT_ORIGIN;
  }
}

export function corsMiddleware(): MiddlewareHandler {
  const validatedOrigin = getValidatedOrigin();
  return cors({
    origin: validatedOrigin,
    credentials: true,
  });
}
