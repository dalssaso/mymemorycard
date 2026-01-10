import "reflect-metadata";
import { describe, it, expect, mock } from "bun:test";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { createMockDrizzleDB } from "@/tests/helpers/drizzle.mocks";

describe("DatabaseConnection", () => {
  it("should create database connection with db instance", () => {
    const dbConnection = new DatabaseConnection();
    expect(dbConnection.db).toBeDefined();
  });

  it("should return true when database health check succeeds", async () => {
    const mockDb = createMockDrizzleDB();
    mockDb.execute = mock().mockResolvedValue([]);

    const dbConnection = new DatabaseConnection(undefined, undefined as unknown as any);
    (dbConnection as unknown as { db: typeof mockDb }).db = mockDb;

    const result = await dbConnection.healthCheck();

    expect(result).toBe(true);
  });

  it("should return false when database health check fails", async () => {
    const mockDb = createMockDrizzleDB();
    mockDb.execute = mock().mockRejectedValue(new Error("Connection failed"));

    const dbConnection = new DatabaseConnection(undefined, undefined as unknown as any);
    (dbConnection as unknown as { db: typeof mockDb }).db = mockDb;

    const result = await dbConnection.healthCheck();

    expect(result).toBe(false);
  });

  it("should handle connection string parameter", () => {
    const connectionString = "postgresql://user:pass@localhost/db";
    const dbConnection = new DatabaseConnection(connectionString);

    expect(dbConnection.db).toBeDefined();
  });
});
