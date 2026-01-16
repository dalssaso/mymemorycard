import { describe, expect, it, mock } from "bun:test";
import "reflect-metadata";

import { Hono } from "hono";
import { createErrorHandler } from "@/infrastructure/http/middleware/error.middleware";
import { Logger } from "@/infrastructure/logging/logger";
import { InternalError, ValidationError } from "@/shared/errors/base";

type ErrorHandlerContext = Parameters<ReturnType<typeof createErrorHandler>>[1];

const makeContext = async (requestId: string): Promise<ErrorHandlerContext> => {
  const app = new Hono<{ Variables: { requestId: string } }>();
  let captured: ErrorHandlerContext | null = null;

  app.use("*", async (c, next) => {
    c.set("requestId", requestId);
    captured = c;
    await next();
  });
  app.get("/", (c) => c.text("ok"));

  await app.request("http://localhost/");
  if (!captured) {
    throw new Error("Failed to create test context");
  }
  return captured;
};

describe("createErrorHandler", () => {
  it("returns snake_case request_id for DomainError", async () => {
    const logger = new Logger();
    const handler = createErrorHandler(logger);
    const response = handler(new ValidationError("bad"), await makeContext("req-123"));
    expect(response.status).toBe(400);
    const body = (await response.json()) as { request_id?: string; code?: string };
    expect(body.request_id).toBe("req-123");
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("returns snake_case request_id for unexpected errors", async () => {
    const logger = new Logger();
    const errorSpy = mock();
    logger.error = errorSpy as unknown as Logger["error"];
    const handler = createErrorHandler(logger);
    const response = handler(new Error("boom"), await makeContext("req-999"));
    expect(response.status).toBe(500);
    const body = (await response.json()) as { request_id?: string; code?: string };
    expect(body.request_id).toBe("req-999");
    expect(body.code).toBe("INTERNAL_ERROR");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("includes details for 4xx DomainError", async () => {
    const logger = new Logger();
    const handler = createErrorHandler(logger);
    const error = new ValidationError("Invalid input", { field: "email", reason: "format" });
    const response = handler(error, await makeContext("req-456"));
    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      error?: string;
      code?: string;
      details?: Record<string, unknown>;
      request_id?: string;
    };
    expect(body.error).toBe("Invalid input");
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.details).toEqual({ field: "email", reason: "format" });
    expect(body.request_id).toBe("req-456");
  });

  it("hides details and uses generic message for InternalError (500)", async () => {
    const logger = new Logger();
    const handler = createErrorHandler(logger);
    const error = new InternalError("Database connection failed", {
      operation: "upsert",
      table: "admin_settings",
    });
    const response = handler(error, await makeContext("req-789"));
    expect(response.status).toBe(500);
    const body = (await response.json()) as {
      error?: string;
      code?: string;
      details?: Record<string, unknown>;
      request_id?: string;
    };
    expect(body.error).toBe("Internal server error");
    expect(body.code).toBe("INTERNAL_ERROR");
    expect(body.details).toBeUndefined();
    expect(body.request_id).toBe("req-789");
  });
});
