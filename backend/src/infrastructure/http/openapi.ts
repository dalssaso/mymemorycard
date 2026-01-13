import { registerDependencies } from "@/container"
import { createHonoApp } from "@/infrastructure/http/app"

const DEFAULT_ENV: Record<string, string> = {
  DATABASE_URL: "postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard",
  REDIS_URL: "redis://localhost:6380",
  JWT_SECRET: "dev-jwt-secret-change-in-production",
  RAWG_API_KEY: "openapi-docs",
  ENCRYPTION_SECRET: "dev-encryption-secret",
  ENCRYPTION_SALT: "dev-encryption-salt",
  SKIP_REDIS_CONNECT: "1",
}

function applyOpenApiEnvDefaults(): void {
  Object.entries(DEFAULT_ENV).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value
    }
  })
}

/**
 * Builds the OpenAPI document from the DI-backed Hono app.
 * Applies default environment variables to avoid required-config failures.
 */
export function buildOpenApiDocument() {
  applyOpenApiEnvDefaults()
  registerDependencies()
  const app = createHonoApp()

  return app.getOpenAPIDocument({
    openapi: "3.0.0",
    info: { title: "MyMemoryCard API", version: "v1" },
  })
}
