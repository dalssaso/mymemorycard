import type { Context } from "hono";
import { DomainError } from "@/shared/errors/base";

export function errorHandler(err: Error, c: Context): Response {
  const requestId = c.get("requestId") || "unknown";

  if (err instanceof DomainError) {
    return c.json(
      {
        error: err.message,
        code: err.code,
        details: err.details,
        requestId,
      },
      err.statusCode as 400 | 401 | 403 | 404 | 409 | 500
    );
  }

  console.error("Unexpected error:", err);

  return c.json(
    {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      requestId,
    },
    500
  );
}
