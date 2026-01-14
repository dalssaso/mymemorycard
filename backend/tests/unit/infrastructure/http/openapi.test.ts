import { describe, expect, it } from "bun:test";
import { buildOpenApiDocument } from "@/infrastructure/http/openapi";

const REQUIRED_ENV_KEYS = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_SECRET",
  "RAWG_API_KEY",
  "ENCRYPTION_SECRET",
  "ENCRYPTION_SALT",
  "SKIP_REDIS_CONNECT",
];

function withClearedEnv(run: () => void): void {
  const previous = new Map<string, string | undefined>();

  REQUIRED_ENV_KEYS.forEach((key) => {
    previous.set(key, process.env[key]);
    delete process.env[key];
  });

  try {
    run();
  } finally {
    previous.forEach((value, key) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  }
}

describe("buildOpenApiDocument", () => {
  it("builds without required env vars", () => {
    withClearedEnv(() => {
      const doc = buildOpenApiDocument();
      expect(doc.openapi).toBe("3.0.0");
      expect(doc.info.title).toBe("MyMemoryCard API");
      expect(doc.info.version).toBe("v1");
      expect(doc.paths["/api/v1/auth/login"]).toBeDefined();
    });
  });

  it("includes versioned auth paths", () => {
    const doc = buildOpenApiDocument();
    const login = doc.paths["/api/v1/auth/login"];
    const register = doc.paths["/api/v1/auth/register"];
    const me = doc.paths["/api/v1/auth/me"];

    expect(doc.openapi).toBe("3.0.0");
    expect(doc.info.title).toBe("MyMemoryCard API");
    expect(doc.info.version).toBe("v1");
    expect(login).toBeDefined();
    expect(register).toBeDefined();
    expect(me).toBeDefined();
    expect(login?.post).toBeDefined();
    expect(register?.post).toBeDefined();
    expect(me?.get).toBeDefined();
    expect(login?.post?.requestBody).toBeDefined();
    expect(register?.post?.requestBody).toBeDefined();
    expect(login?.post?.responses?.["200"]).toBeDefined();
    expect(register?.post?.responses?.["201"]).toBeDefined();
    expect(me?.get?.responses?.["200"]).toBeDefined();
  });
});
