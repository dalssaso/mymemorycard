import "reflect-metadata";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Config } from "@/infrastructure/config/config";

describe("Config", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Required environment variables", () => {
    it("should throw when DATABASE_URL is missing", () => {
      delete process.env.DATABASE_URL;
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret-minimum-32-chars-long-12345678";
      process.env.RAWG_API_KEY = "key";

      expect(() => new Config()).toThrow("Missing required environment variable: DATABASE_URL");
    });

    it("should throw when REDIS_URL is missing", () => {
      process.env.DATABASE_URL = "postgresql://localhost/db";
      delete process.env.REDIS_URL;
      process.env.JWT_SECRET = "test-jwt-secret-minimum-32-chars-long-12345678";
      process.env.RAWG_API_KEY = "key";

      expect(() => new Config()).toThrow("Missing required environment variable: REDIS_URL");
    });

    it("should throw when JWT_SECRET is missing", () => {
      process.env.DATABASE_URL = "postgresql://localhost/db";
      process.env.REDIS_URL = "redis://localhost:6379";
      delete process.env.JWT_SECRET;
      process.env.RAWG_API_KEY = "key";

      expect(() => new Config()).toThrow("Missing required environment variable: JWT_SECRET");
    });

    it("should throw when RAWG_API_KEY is missing", () => {
      process.env.DATABASE_URL = "postgresql://localhost/db";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret-minimum-32-chars-long-12345678";
      delete process.env.RAWG_API_KEY;
      process.env.ENCRYPTION_SECRET = "test-encryption-secret-min-32-chars-long-1234";
      process.env.ENCRYPTION_SALT = "test-encryption-salt-minimum-32-chars-long-12";

      expect(() => new Config()).toThrow("Missing required environment variable: RAWG_API_KEY");
    });

    it("should throw when ENCRYPTION_SECRET is missing", () => {
      process.env.DATABASE_URL = "postgresql://localhost/db";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret-minimum-32-chars-long-12345678";
      process.env.RAWG_API_KEY = "key";
      delete process.env.ENCRYPTION_SECRET;
      process.env.ENCRYPTION_SALT = "test-encryption-salt-minimum-32-chars-long-12";

      expect(() => new Config()).toThrow(
        "Missing required environment variable: ENCRYPTION_SECRET"
      );
    });

    it("should throw when ENCRYPTION_SALT is missing", () => {
      process.env.DATABASE_URL = "postgresql://localhost/db";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret-minimum-32-chars-long-12345678";
      process.env.RAWG_API_KEY = "key";
      process.env.ENCRYPTION_SECRET = "test-encryption-secret-min-32-chars-long-1234";
      delete process.env.ENCRYPTION_SALT;

      expect(() => new Config()).toThrow("Missing required environment variable: ENCRYPTION_SALT");
    });

    it("should create config when all required vars are present", () => {
      process.env.DATABASE_URL = "postgresql://localhost/db";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret-minimum-32-chars-long-12345678";
      process.env.RAWG_API_KEY = "key";
      process.env.ENCRYPTION_SECRET = "test-encryption-secret-min-32-chars-long-1234";
      process.env.ENCRYPTION_SALT = "test-encryption-salt-minimum-32-chars-long-12";

      const config = new Config();

      expect(config.database.url).toBe("postgresql://localhost/db");
      expect(config.redis.url).toBe("redis://localhost:6379");
      expect(config.jwt.secret).toBe("test-jwt-secret-minimum-32-chars-long-12345678");
      expect(config.rawg.apiKey).toBe("key");
      expect(config.encryption.secret).toBe("test-encryption-secret-min-32-chars-long-1234");
      expect(config.encryption.salt).toBe("test-encryption-salt-minimum-32-chars-long-12");
    });
  });

  describe("Optional environment variables", () => {
    beforeEach(() => {
      process.env.DATABASE_URL = "postgresql://localhost/db";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret-minimum-32-chars-long-12345678";
      process.env.RAWG_API_KEY = "key";
      process.env.ENCRYPTION_SECRET = "test-encryption-secret-min-32-chars-long-1234";
      process.env.ENCRYPTION_SALT = "test-encryption-salt-minimum-32-chars-long-12";
    });

    it("should use default port when PORT is not set", () => {
      delete process.env.PORT;
      const config = new Config();
      expect(config.port).toBe(3000);
    });

    it("should use custom port when PORT is set", () => {
      process.env.PORT = "8080";
      const config = new Config();
      expect(config.port).toBe(8080);
    });

    it("should use default bcrypt saltRounds when not set", () => {
      delete process.env.BCRYPT_SALT_ROUNDS;
      const config = new Config();
      expect(config.bcrypt.saltRounds).toBe(10);
    });

    it("should use custom bcrypt saltRounds when set", () => {
      process.env.BCRYPT_SALT_ROUNDS = "12";
      const config = new Config();
      expect(config.bcrypt.saltRounds).toBe(12);
    });
  });

  describe("CORS configuration", () => {
    beforeEach(() => {
      process.env.DATABASE_URL = "postgresql://localhost/db";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret-minimum-32-chars-long-12345678";
      process.env.RAWG_API_KEY = "key";
      process.env.ENCRYPTION_SECRET = "test-encryption-secret-min-32-chars-long-1234";
      process.env.ENCRYPTION_SALT = "test-encryption-salt-minimum-32-chars-long-12";
    });

    it("should include default origins and ORIGIN when set", () => {
      process.env.ORIGIN = "https://example.com";
      const config = new Config();

      expect(config.cors.origin).toBe("https://example.com");
      expect(config.cors.allowedOrigins).toContain("http://localhost:5173");
      expect(config.cors.allowedOrigins).toContain("http://localhost:3000");
      expect(config.cors.allowedOrigins).toContain("https://example.com");
    });

    it("should only include default origins when ORIGIN is not set", () => {
      delete process.env.ORIGIN;
      const config = new Config();

      expect(config.cors.origin).toBeUndefined();
      expect(config.cors.allowedOrigins).toEqual([
        "http://localhost:5173",
        "http://localhost:3000",
      ]);
    });
  });

  describe("JWT secret validation", () => {
    beforeEach(() => {
      process.env.DATABASE_URL = "postgresql://localhost/db";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.RAWG_API_KEY = "key";
      process.env.ENCRYPTION_SECRET = "test-encryption-secret-min-32-chars-long-1234";
      process.env.ENCRYPTION_SALT = "test-encryption-salt-minimum-32-chars-long-12";
    });

    it("should throw when JWT_SECRET is less than 32 characters in production", () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "short-secret";

      expect(() => new Config()).toThrow("JWT_SECRET must be at least 32 characters");
    });

    it("should allow short JWT_SECRET in development", () => {
      process.env.NODE_ENV = "development";
      process.env.JWT_SECRET = "short-secret";

      expect(() => new Config()).not.toThrow();
      const config = new Config();
      expect(config.jwt.secret).toBe("short-secret");
    });

    it("should allow JWT_SECRET with 32 or more characters in production", () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "this-is-a-very-long-secret-with-32-characters";
      process.env.ENCRYPTION_SECRET = "this-is-a-very-long-encryption-secret-32chars";
      process.env.ENCRYPTION_SALT = "this-is-a-long-encryption-salt";

      expect(() => new Config()).not.toThrow();
      const config = new Config();
      expect(config.jwt.secret).toBe("this-is-a-very-long-secret-with-32-characters");
    });
  });

  describe("Derived values", () => {
    beforeEach(() => {
      process.env.DATABASE_URL = "postgresql://localhost/db";
      process.env.REDIS_URL = "redis://localhost:6379";
      process.env.JWT_SECRET = "test-jwt-secret-minimum-32-chars-long-12345678";
      process.env.RAWG_API_KEY = "key";
      process.env.ENCRYPTION_SECRET = "test-encryption-secret-min-32-chars-long-1234";
      process.env.ENCRYPTION_SALT = "test-encryption-salt-minimum-32-chars-long-12";
    });

    it("should set isProduction to true when NODE_ENV is production", () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "this-is-a-very-long-secret-with-32-characters";
      process.env.ENCRYPTION_SECRET = "this-is-a-very-long-encryption-secret-32chars";
      process.env.ENCRYPTION_SALT = "this-is-a-long-encryption-salt";
      const config = new Config();
      expect(config.isProduction).toBe(true);
    });

    it("should set isProduction to false when NODE_ENV is not production", () => {
      process.env.NODE_ENV = "development";
      const config = new Config();
      expect(config.isProduction).toBe(false);
    });

    it("should set skipRedisConnect to true when SKIP_REDIS_CONNECT is 1", () => {
      process.env.SKIP_REDIS_CONNECT = "1";
      const config = new Config();
      expect(config.skipRedisConnect).toBe(true);
    });

    it("should set skipRedisConnect to false when SKIP_REDIS_CONNECT is not 1", () => {
      delete process.env.SKIP_REDIS_CONNECT;
      const config = new Config();
      expect(config.skipRedisConnect).toBe(false);
    });
  });
});
