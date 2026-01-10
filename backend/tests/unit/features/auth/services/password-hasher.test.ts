import "reflect-metadata";
import { describe, it, expect } from "bun:test";
import { PasswordHasher } from "@/features/auth/services/password-hasher";
import type { IConfig } from "@/infrastructure/config/config.interface";

describe("PasswordHasher", () => {
  const mockConfig: IConfig = {
    port: 3000,
    database: {
      url: "postgresql://test",
    },
    redis: {
      url: "redis://localhost:6380",
    },
    jwt: {
      secret: "test-secret",
    },
    bcrypt: {
      saltRounds: 10,
    },
    rawg: {
      apiKey: "test-key",
    },
    cors: {
      allowedOrigins: ["http://localhost:5173"],
    },
    isProduction: false,
    skipRedisConnect: true,
  };

  const hasher = new PasswordHasher(mockConfig);

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

  it("should handle very long passwords", async () => {
    const password = "a".repeat(200);
    const hash = await hasher.hash(password);

    const isValid = await hasher.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it("should handle passwords with special characters", async () => {
    const password = "P@ssw0rd!#$%^&*()_+-=[]{}|;:',.<>?/~`";
    const hash = await hasher.hash(password);

    const isValid = await hasher.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it("should handle empty password", async () => {
    const password = "";
    const hash = await hasher.hash(password);

    const isValid = await hasher.compare(password, hash);
    expect(isValid).toBe(true);
  });
});
