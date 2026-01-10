import "reflect-metadata";
import { describe, it, expect } from "bun:test";
import { DatabaseConnection } from "@/infrastructure/database/connection";

describe("DatabaseConnection", () => {
  it("should create database connection with db instance", () => {
    const dbConnection = new DatabaseConnection();
    expect(dbConnection.db).toBeDefined();
  });

  it("should have healthCheck method", () => {
    const dbConnection = new DatabaseConnection();
    expect(typeof dbConnection.healthCheck).toBe("function");
  });

  it("should have close method", () => {
    const dbConnection = new DatabaseConnection();
    expect(typeof dbConnection.close).toBe("function");
  });

  it("should accept connection string parameter", () => {
    const connectionString = "postgresql://user:pass@localhost/db";
    const dbConnection = new DatabaseConnection(connectionString);

    expect(dbConnection.db).toBeDefined();
  });
});
