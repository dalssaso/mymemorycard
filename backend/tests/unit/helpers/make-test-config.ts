import type { IConfig } from "@/infrastructure/config/config.interface";

/**
 * Helper to create minimal test config with sensible defaults.
 * Allows overrides for specific test scenarios.
 * Shared across all unit tests to ensure consistent config structure.
 */
export function makeTestConfig(overrides?: Partial<IConfig>): IConfig {
  return {
    port: 3000,
    database: { url: "postgresql://test" },
    redis: { url: "redis://localhost:6380" },
    jwt: {
      secret: "test-jwt-secret-key-minimum-32-chars",
      expiresIn: "7d",
    },
    bcrypt: { saltRounds: 10 },
    rawg: { apiKey: "test-key" },
    encryption: {
      secret: "test-encryption-secret-very-long",
      salt: "test-encryption-salt-1234567890",
    },
    cors: { allowedOrigins: ["http://localhost:5173"] },
    isProduction: false,
    skipRedisConnect: true,
    ...overrides,
  };
}
