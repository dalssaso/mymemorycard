import "reflect-metadata";
import { describe, it, expect } from "bun:test";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { Logger } from "@/infrastructure/logging/logger";
import { makeTestConfig } from "../../helpers/make-test-config";

describe("DatabaseConnection", () => {
  it("should create database connection with db instance", () => {
    const logger = new Logger("test");
    const dbConnection = new DatabaseConnection(makeTestConfig(), logger);
    expect(dbConnection.db).toBeDefined();
  });

  it("should accept connection string from config", () => {
    const customConfig = makeTestConfig({
      database: {
        url: "postgresql://user:pass@localhost/db",
      },
    });
    const logger = new Logger("test");
    const dbConnection = new DatabaseConnection(customConfig, logger);

    expect(dbConnection.db).toBeDefined();
  });

  it("should apply database pool configuration from config", () => {
    const configWithPool = makeTestConfig({
      database: {
        url: "postgresql://test",
        pool: {
          max: 20,
          idleTimeout: 60,
          connectTimeout: 15,
        },
      },
    });
    const logger = new Logger("test");
    const dbConnection = new DatabaseConnection(configWithPool, logger);

    expect(dbConnection.db).toBeDefined();
  });

  it("should apply default pool configuration when none provided", () => {
    const configNoPool = makeTestConfig({
      database: {
        url: "postgresql://test",
      },
    });
    const logger = new Logger("test");
    const dbConnection = new DatabaseConnection(configNoPool, logger);

    expect(dbConnection.db).toBeDefined();
  });

  describe("healthCheck()", () => {
    it("should return a boolean promise", async () => {
      const logger = new Logger("test");
      const dbConnection = new DatabaseConnection(makeTestConfig(), logger);

      const result = dbConnection.healthCheck();

      expect(result instanceof Promise).toBe(true);
      const value = await result;
      expect(typeof value).toBe("boolean");
    });

    it.skipIf(!process.env.CI || !process.env.DATABASE_URL)(
      "should return true when database is healthy",
      async () => {
      const logger = new Logger("test");
      const dbConnection = new DatabaseConnection(makeTestConfig(), logger);

      let result = false;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        result = await dbConnection.healthCheck();
        if (result) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      expect(typeof result).toBe("boolean");
      // Returns true if connection to local test database is available
      expect(result).toBe(true);
      }
    );

    it("should return false when database is unhealthy", async () => {
      const badConfig = makeTestConfig({
        database: {
          url: "postgresql://invalid:invalid@nonexistent:5555/nonexistent",
        },
      });
      const logger = new Logger("test");
      const dbConnection = new DatabaseConnection(badConfig, logger);

      const result = await dbConnection.healthCheck();

      expect(typeof result).toBe("boolean");
      // Returns false if connection fails (invalid host)
      expect(result).toBe(false);
    });
  });

  describe("close()", () => {
    it("should return a void promise", async () => {
      const logger = new Logger("test");
      const dbConnection = new DatabaseConnection(makeTestConfig(), logger);

      const result = dbConnection.close();

      expect(result instanceof Promise).toBe(true);
      const value = await result;
      expect(value).toBeUndefined();
    });

    it("should not throw errors during close", async () => {
      const logger = new Logger("test");
      const dbConnection = new DatabaseConnection(makeTestConfig(), logger);

      // Should resolve successfully
      const result = dbConnection.close();
      expect(result instanceof Promise).toBe(true);
      await result;
    });
  });
});
