import type { OpenAPIObject } from "openapi3-ts/oas30";
import { registerDependencies } from "@/container";
import { createHonoApp } from "@/infrastructure/http/app";

const DEFAULT_ENV: ReadonlyArray<readonly [string, string]> = [
  ["DATABASE_URL", "postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard"],
  ["REDIS_URL", "redis://localhost:6380"],
  ["JWT_SECRET", "dev-jwt-secret-change-in-production"],
  ["RAWG_API_KEY", "openapi-docs"],
  ["ENCRYPTION_SECRET", "dev-encryption-secret"],
  ["ENCRYPTION_SALT", "dev-encryption-salt"],
  ["SKIP_REDIS_CONNECT", "1"],
];

function applyOpenApiEnvDefaults(): void {
  DEFAULT_ENV.forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

/**
 * Converts Hono-style path params (:id) to OpenAPI-style ({id}).
 */
function convertPathParams(paths: Record<string, unknown>): Record<string, unknown> {
  const converted: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(paths)) {
    const openApiPath = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, "{$1}");
    converted[openApiPath] = value;
  }
  return converted;
}

/**
 * Builds the OpenAPI document from the DI-backed Hono app.
 * Applies default environment variables to avoid required-config failures.
 */
export function buildOpenApiDocument(): OpenAPIObject {
  applyOpenApiEnvDefaults();
  registerDependencies();
  const app = createHonoApp();

  const document = app.getOpenAPIDocument({
    openapi: "3.0.0",
    info: { title: "MyMemoryCard API", version: "v1" },
  });

  // Convert path params from :id to {id} format
  if (document.paths) {
    document.paths = convertPathParams(document.paths) as typeof document.paths;
  }

  const components = document.components ?? {};
  document.components = {
    ...components,
    securitySchemes: {
      ...components.securitySchemes,
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  };
  return document;
}
