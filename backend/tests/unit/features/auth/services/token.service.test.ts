import "reflect-metadata";
import { describe, it, expect, beforeEach } from "bun:test";
import { TokenService } from "@/features/auth/services/token.service";
import { makeTestConfig } from "../../../helpers/make-test-config";

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

  it("should return null for expired token", async () => {
    // Create a token service with very short expiry
    const shortExpiryService = new TokenService(
      makeTestConfig({
        jwt: { secret: "test-secret", expiresIn: "1ms" },
      })
    );

    const payload = { userId: "user-123", username: "testuser" };
    const token = shortExpiryService.generateToken(payload);

    // Wait briefly for token to expire
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify the expired token returns null
    const verified = shortExpiryService.verifyToken(token);
    expect(verified).toBeNull();
  });
});
