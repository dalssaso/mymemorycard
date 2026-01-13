import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { createErrorHandler } from "@/infrastructure/http/middleware/error.middleware";
import { Logger } from "@/infrastructure/logging/logger";
import { ValidationError } from "@/shared/errors/base";

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
    const body = (await response.json()) as { request_id?: string };
    expect(body.request_id).toBe("req-123");
  });

  it("returns snake_case request_id for unexpected errors", async () => {
    const logger = new Logger();
    const handler = createErrorHandler(logger);
    const response = handler(new Error("boom"), await makeContext("req-999"));
    const body = (await response.json()) as { request_id?: string };
    expect(body.request_id).toBe("req-999");
  });
});
