import "reflect-metadata";
import { describe, it, expect } from "bun:test";
import { Logger } from "@/infrastructure/logging/logger";

describe("Logger", () => {
  it("should create logger", () => {
    const logger = new Logger();

    expect(logger).toBeInstanceOf(Logger);
  });

  it("should create child logger with context", () => {
    const logger = new Logger();
    const childLogger = logger.child("TestService");

    expect(childLogger).toBeInstanceOf(Logger);
  });

  it("should chain child loggers", () => {
    const logger = new Logger();
    const parentLogger = logger.child("ParentService");
    const childLogger = parentLogger.child("ChildService");

    expect(childLogger).toBeInstanceOf(Logger);
  });

  it("should have log methods", () => {
    const logger = new Logger();

    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });
});
