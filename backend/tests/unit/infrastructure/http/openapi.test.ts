import { describe, expect, it } from "bun:test"
import { buildOpenApiDocument } from "@/infrastructure/http/openapi"

const REQUIRED_ENV_KEYS = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_SECRET",
  "RAWG_API_KEY",
  "ENCRYPTION_SECRET",
  "ENCRYPTION_SALT",
]

function withClearedEnv(run: () => void): void {
  const previous = new Map<string, string | undefined>()

  REQUIRED_ENV_KEYS.forEach((key) => {
    previous.set(key, process.env[key])
    delete process.env[key]
  })

  try {
    run()
  } finally {
    previous.forEach((value, key) => {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    })
  }
}

describe("buildOpenApiDocument", () => {
  it("builds without required env vars", () => {
    withClearedEnv(() => {
      const doc = buildOpenApiDocument()
      expect(doc.paths["/api/v1/auth/login"]).toBeDefined()
    })
  })

  it("includes versioned auth paths", () => {
    const doc = buildOpenApiDocument()

    expect(doc.paths["/api/v1/auth/login"]).toBeDefined()
    expect(doc.paths["/api/v1/auth/register"]).toBeDefined()
    expect(doc.paths["/api/v1/auth/me"]).toBeDefined()
  })
})
