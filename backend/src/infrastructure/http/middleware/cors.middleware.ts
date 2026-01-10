import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { Logger } from "@/infrastructure/logging/logger";

const VITE_DEFAULT_ORIGIN = "http://localhost:5173";

/**
 * Validates ORIGIN environment variable:
 * - Trims whitespace
 * - Parses as URL using URL constructor
 * - Restricts protocol to http: or https: only (security-critical with credentials: true)
 * - Falls back to Vite dev server default if invalid
 */
function getValidatedOrigin(logger: Logger): string {
  const originalValue = process.env.ORIGIN;

  if (!originalValue) {
    return VITE_DEFAULT_ORIGIN;
  }

  const trimmed = originalValue.trim();

  if (trimmed === "") {
    logger.warn(
      `Invalid ORIGIN value: "${originalValue}". Must not be empty or whitespace-only. Falling back to default: "${VITE_DEFAULT_ORIGIN}"`
    );
    return VITE_DEFAULT_ORIGIN;
  }

  try {
    const url = new URL(trimmed);

    // Restrict to http: or https: only (no file:, data:, custom protocols, etc.)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      logger.warn(
        `Invalid ORIGIN value: "${originalValue}". Protocol must be http: or https: (got "${url.protocol}"). Falling back to default: "${VITE_DEFAULT_ORIGIN}"`
      );
      return VITE_DEFAULT_ORIGIN;
    }

    return trimmed;
  } catch {
    logger.warn(
      `Invalid ORIGIN value: "${originalValue}". Must be a valid URL with http: or https: protocol. Falling back to default: "${VITE_DEFAULT_ORIGIN}"`
    );
    return VITE_DEFAULT_ORIGIN;
  }
}

export function corsMiddleware(logger: Logger): MiddlewareHandler {
  const validatedOrigin = getValidatedOrigin(logger);
  return cors({
    origin: validatedOrigin,
    credentials: true,
  });
}
