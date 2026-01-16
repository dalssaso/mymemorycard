import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { DomainError } from "@/shared/errors/base";
import type { Logger } from "@/infrastructure/logging/logger";

/**
 * Creates error handler with the provided Logger instance.
 * This factory pattern avoids resolving from the container on every error.
 */
export function createErrorHandler(logger: Logger) {
  return function errorHandler(err: Error, c: Context): Response {
    const requestId = c.get("requestId") || "unknown";

    // Handle Hono's HTTPException (used by middleware)
    if (err instanceof HTTPException) {
      const status = err.status;
      let code = "ERROR";
      if (status === 401) {
        code = "UNAUTHORIZED";
      } else if (status === 403) {
        code = "FORBIDDEN";
      }

      return c.json(
        {
          error: err.message,
          code,
          request_id: requestId,
        },
        status
      );
    }

    if (err instanceof DomainError) {
      // Validate status code is a valid HTTP status (3-digit number)
      const statusCode =
        typeof err.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 600
          ? (err.statusCode as unknown as 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500)
          : 500;

      // For 500 errors, hide internal details and use generic message
      if (statusCode === 500) {
        return c.json(
          {
            error: "Internal server error",
            code: err.code,
            request_id: requestId,
          },
          statusCode
        );
      }

      return c.json(
        {
          error: err.message,
          code: err.code,
          ...(err.details && { details: err.details }),
          request_id: requestId,
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
        request_id: requestId,
      },
      500
    );
  };
}
