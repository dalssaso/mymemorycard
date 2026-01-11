import type { Context } from "hono";
import { DomainError } from "@/shared/errors/base";
import type { Logger } from "@/infrastructure/logging/logger";

/**
 * Creates error handler with the provided Logger instance.
 * This factory pattern avoids resolving from the container on every error.
 */
export function createErrorHandler(logger: Logger) {
  return function errorHandler(err: Error, c: Context): Response {
    const requestId = c.get("requestId") || "unknown";

    if (err instanceof DomainError) {
      // Validate status code is a valid HTTP status (3-digit number)
      const statusCode =
        typeof err.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 600
          ? (err.statusCode as unknown as 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500)
          : 500;

      return c.json(
        {
          error: err.message,
          code: err.code,
          details: err.details,
          requestId,
        },
        statusCode
      );
    }

    // Log unexpected errors with structured logging
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error("Unexpected error in request handler", message, stack);

    return c.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        requestId,
      },
      500
    );
  };
}
