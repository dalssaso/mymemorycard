import { describe, expect, it } from "bun:test";
import { createErrorHandler } from "@/infrastructure/http/middleware/error.middleware";
import { Logger } from "@/infrastructure/logging/logger";
import { ValidationError } from "@/shared/errors/base";

const makeContext = (requestId: string) =>
  ({
    get: (key: string) => (key === "requestId" ? requestId : undefined),
    json: (body: unknown, status: number) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  }) as unknown as Parameters<ReturnType<typeof createErrorHandler>>[1];

describe("createErrorHandler", () => {
  it("returns snake_case request_id for DomainError", async () => {
    const logger = new Logger();
    const handler = createErrorHandler(logger);
    const response = handler(new ValidationError("bad"), makeContext("req-123"));
    const body = await response.json();
    expect(body.request_id).toBe("req-123");
  });

  it("returns snake_case request_id for unexpected errors", async () => {
    const logger = new Logger();
    const handler = createErrorHandler(logger);
    const response = handler(new Error("boom"), makeContext("req-999"));
    const body = await response.json();
    expect(body.request_id).toBe("req-999");
  });
});
