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
});
