import "reflect-metadata";
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { registerDependencies, resetContainer, container } from "@/container";
import { DatabaseConnection } from "@/infrastructure/database/connection";

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

      expect(typeof result).toBe("boolean");
      // Returns true if connection to test database is available
      expect(result).toBe(true);
    });
  });
});
