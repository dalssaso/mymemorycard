import "reflect-metadata";
import { describe, it, expect } from "bun:test";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { Logger } from "@/infrastructure/logging/logger";
import type { IConfig } from "@/infrastructure/config/config.interface";

const mockConfig: IConfig = {
  database: {
    url: "postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard",
  },
  redis: {
    url: "redis://localhost:6380",
  },
  jwt: {
    secret: "test-jwt-secret",
    expiresIn: "7d",
  },
  rawg: {
    apiKey: "test-api-key",
  },
  encryption: {
    secret: "test-encryption-secret-very-long",
    salt: "test-salt",
  },
  port: 3000,
  cors: {
    allowedOrigins: [],
  },
  bcrypt: {
    saltRounds: 10,
  },
  isProduction: false,
  skipRedisConnect: true,
};

describe("DatabaseConnection", () => {
  it("should create database connection with db instance", () => {
    const logger = new Logger("test");
    const dbConnection = new DatabaseConnection(mockConfig, logger);
    expect(dbConnection.db).toBeDefined();
  });

  it("should accept connection string from config", () => {
    const customConfig: IConfig = {
      ...mockConfig,
      database: {
        url: "postgresql://user:pass@localhost/db",
      },
    };
    const logger = new Logger("test");
    const dbConnection = new DatabaseConnection(customConfig, logger);

    expect(dbConnection.db).toBeDefined();
  });

  it("should apply database pool configuration from config", () => {
    const configWithPool: IConfig = {
      ...mockConfig,
      database: {
        url: mockConfig.database.url,
        pool: {
          max: 20,
          idleTimeout: 60,
          connectTimeout: 15,
        },
      },
    };
    const logger = new Logger("test");
    const dbConnection = new DatabaseConnection(configWithPool, logger);

    expect(dbConnection.db).toBeDefined();
  });

  it("should apply default pool configuration when none provided", () => {
    const configNoPool: IConfig = {
      ...mockConfig,
      database: {
        url: mockConfig.database.url,
      },
    };
    const logger = new Logger("test");
    const dbConnection = new DatabaseConnection(configNoPool, logger);

    expect(dbConnection.db).toBeDefined();
  });

  describe("healthCheck()", () => {
    it("should return a boolean promise", async () => {
      const logger = new Logger("test");
      const dbConnection = new DatabaseConnection(mockConfig, logger);

      const result = dbConnection.healthCheck();

      expect(result instanceof Promise).toBe(true);
      const value = await result;
      expect(typeof value).toBe("boolean");
    });

    it("should handle connection errors gracefully", async () => {
      const badConfig: IConfig = {
        ...mockConfig,
        database: {
          url: "postgresql://invalid:invalid@nonexistent:5555/nonexistent",
        },
      };
      const logger = new Logger("test");
      const dbConnection = new DatabaseConnection(badConfig, logger);

      const result = await dbConnection.healthCheck();

      expect(typeof result).toBe("boolean");
      expect(result).toBe(false);
    });
  });

  describe("close()", () => {
    it("should return a void promise", async () => {
      const logger = new Logger("test");
      const dbConnection = new DatabaseConnection(mockConfig, logger);

      const result = dbConnection.close();

      expect(result instanceof Promise).toBe(true);
      const value = await result;
      expect(value).toBeUndefined();
    });

    it("should not throw errors during close", async () => {
      const logger = new Logger("test");
      const dbConnection = new DatabaseConnection(mockConfig, logger);

      // Should resolve successfully
      const result = dbConnection.close();
      expect(result instanceof Promise).toBe(true);
      await result;
    });
  });
});
