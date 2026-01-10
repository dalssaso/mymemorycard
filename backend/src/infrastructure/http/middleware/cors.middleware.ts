import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

const VITE_DEFAULT_ORIGIN = "http://localhost:5173";

/**
 * Validates ORIGIN environment variable:
 * - Trims whitespace
 * - Parses as URL using URL constructor
 * - Restricts protocol to http: or https: only (security-critical with credentials: true)
 * - Falls back to Vite dev server default if invalid
 */
function getValidatedOrigin(): string {
  const originalValue = process.env.ORIGIN;

  if (!originalValue) {
    return VITE_DEFAULT_ORIGIN;
  }

  const trimmed = originalValue.trim();

  if (trimmed === "") {
    console.warn(
      `Invalid ORIGIN value: "${originalValue}". ` +
        `Must not be empty or whitespace-only. Falling back to default: "${VITE_DEFAULT_ORIGIN}"`
    );
    return VITE_DEFAULT_ORIGIN;
  }

  try {
    const url = new URL(trimmed);

    // Restrict to http: or https: only (no file:, data:, custom protocols, etc.)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      console.warn(
        `Invalid ORIGIN value: "${originalValue}". ` +
          `Protocol must be http: or https: (got "${url.protocol}"). Falling back to default: "${VITE_DEFAULT_ORIGIN}"`
      );
      return VITE_DEFAULT_ORIGIN;
    }

    return trimmed;
  } catch {
    console.warn(
      `Invalid ORIGIN value: "${originalValue}". ` +
        `Must be a valid URL with http: or https: protocol. Falling back to default: "${VITE_DEFAULT_ORIGIN}"`
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
