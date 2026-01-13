import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { registerDependencies, resetContainer, container } from "@/container";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { Logger } from "@/infrastructure/logging/logger";
import { makeTestConfig } from "../../../unit/helpers/make-test-config";

describe("DatabaseConnection Integration Tests", () => {
  let dbConnection: DatabaseConnection;

  beforeAll(() => {
    // Bun automatically loads .env files
    registerDependencies();
    dbConnection = container.resolve(DatabaseConnection);
  });

  afterAll(async () => {
    await dbConnection.close();
    resetContainer();
  });

  describe("healthCheck()", () => {
    it("should return true when database is healthy", async () => {
      const result = await dbConnection.healthCheck();

      // Returns true if connection to test database is available
      expect(result).toBe(true);
    });

    it("should return false when database is unreachable", async () => {
      // Create a connection with invalid configuration
      const badConfig = makeTestConfig({
        database: {
          url: "postgresql://invalid:invalid@nonexistent-host-12345:9999/nonexistent",
        },
      });

      const logger = new Logger().child("test");
      const badConnection = new DatabaseConnection(badConfig, logger);

      const result = await badConnection.healthCheck();

      // Should return false when connection fails
      expect(result).toBe(false);

      // Cleanup
      await badConnection.close();
    });
  });
});
