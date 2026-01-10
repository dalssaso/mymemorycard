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

  it("should have healthCheck method", () => {
    const logger = new Logger("test");
    const dbConnection = new DatabaseConnection(mockConfig, logger);
    expect(typeof dbConnection.healthCheck).toBe("function");
  });

  it("should have close method", () => {
    const logger = new Logger("test");
    const dbConnection = new DatabaseConnection(mockConfig, logger);
    expect(typeof dbConnection.close).toBe("function");
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
});
