import "reflect-metadata";
import { describe, it, expect, beforeEach } from "bun:test";
import type { IConfig } from "@/infrastructure/config/config.interface";
import { TokenService } from "@/features/auth/services/token.service";

/**
 * Helper to create minimal test config with sensible defaults.
 * Allows overrides for specific test scenarios.
 */
function makeTestConfig(overrides?: Partial<IConfig>): IConfig {
  return {
    port: 3000,
    database: { url: "postgresql://test" },
    redis: { url: "redis://localhost:6380" },
    jwt: { secret: "test-secret", expiresIn: "7d" },
    bcrypt: { saltRounds: 10 },
    rawg: { apiKey: "test-key" },
    encryption: { secret: "test-encryption-secret-very-long", salt: "test-salt" },
    cors: { allowedOrigins: ["http://localhost:5173"] },
    isProduction: false,
    skipRedisConnect: true,
    ...overrides,
  };
}

describe("TokenService", () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService(makeTestConfig());
  });

  it("should generate JWT token", () => {
    const payload = { userId: "user-123", username: "testuser" };
    const token = tokenService.generateToken(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("should verify valid token", () => {
    const payload = { userId: "user-123", username: "testuser" };
    const token = tokenService.generateToken(payload);

    const verified = tokenService.verifyToken(token);

    expect(verified).toBeDefined();
    expect(verified?.userId).toBe("user-123");
    expect(verified?.username).toBe("testuser");
  });

  it("should return null for invalid token", () => {
    const verified = tokenService.verifyToken("invalid.token.here");

    expect(verified).toBeNull();
  });

  it("should return null for malformed token", () => {
    const verified = tokenService.verifyToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid");

    expect(verified).toBeNull();
  });
});
