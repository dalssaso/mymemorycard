import { describe, expect, it } from "bun:test";
import { buildOpenApiDocument } from "@/infrastructure/http/openapi";

describe("buildOpenApiDocument", () => {
  it("includes versioned auth paths", () => {
    const doc = buildOpenApiDocument();

    expect(doc.paths["/api/v1/auth/login"]).toBeDefined();
    expect(doc.paths["/api/v1/auth/register"]).toBeDefined();
    expect(doc.paths["/api/v1/auth/me"]).toBeDefined();
  });
});
