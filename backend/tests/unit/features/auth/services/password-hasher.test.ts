import "reflect-metadata";
import { describe, it, expect } from "bun:test";
import { PasswordHasher } from "@/features/auth/services/password-hasher";
import type { IConfig } from "@/infrastructure/config/config.interface";

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

describe("PasswordHasher", () => {
  const hasher = new PasswordHasher(makeTestConfig());

  it("should hash password with valid bcrypt format", async () => {
    const password = "SecurePassword123!";
    const hash = await hasher.hash(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    // Bcrypt hashes are always 60 characters
    expect(hash.length).toBe(60);
    // Validate bcrypt format: $2a$10$ or similar
    expect(hash).toMatch(/^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/);
  });

  it("should compare password with hash correctly", async () => {
    const password = "SecurePassword123!";
    const hash = await hasher.hash(password);

    const isValid = await hasher.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it("should return false for invalid password", async () => {
    const password = "SecurePassword123!";
    const hash = await hasher.hash(password);

    const isValid = await hasher.compare("WrongPassword", hash);
    expect(isValid).toBe(false);
  });

  it("should handle passwords with special characters", async () => {
    const password = "P@ssw0rd!#$%^&*()_+-=[]{}|;:',.<>?/~`";
    const hash = await hasher.hash(password);

    const isValid = await hasher.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it("should handle minimum length password (8 chars)", async () => {
    const password = "Pass1234";
    const hash = await hasher.hash(password);

    const isValid = await hasher.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it("should handle maximum safe password length (72 bytes)", async () => {
    // 72-character password (at bcryptjs byte limit)
    const password = "a".repeat(72);
    const hash = await hasher.hash(password);

    const isValid = await hasher.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it("should not accept passwords over 72 bytes (truncation risk)", async () => {
    // Note: Validation layer should reject this before reaching hasher
    // This test documents that passwords over 72 bytes create collision risk:
    // Two different 73+ byte passwords differing only after byte 72 would hash identically
    const password73 = "a".repeat(73);
    const hash = await hasher.hash(password73);

    // A different password that matches the first 72 bytes hashes the same
    const password73Different = "a".repeat(72) + "b";
    const isValid = await hasher.compare(password73Different, hash);

    // They hash identically due to bcryptjs truncation at 72 bytes - this is a problem!
    // DTO validation (max 72) prevents this scenario from reaching the hasher
    expect(isValid).toBe(true); // Both truncate to 72 'a's
  });
});
