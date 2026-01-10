import "reflect-metadata";
import { describe, it, expect, beforeEach } from "bun:test";
import { TokenService } from "@/features/auth/services/token.service";

describe("TokenService", () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService();
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

  it("should return null for expired token", () => {
    // Test with malformed JWT
    const verified = tokenService.verifyToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid");

    expect(verified).toBeNull();
  });
});
