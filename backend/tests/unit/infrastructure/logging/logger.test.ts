import "reflect-metadata";
import { describe, it, expect } from "bun:test";
import { Logger } from "@/infrastructure/logging/logger";

describe("Logger", () => {
  it("should create logger with context", () => {
    const logger = new Logger().child("TestService");

    expect(logger).toBeInstanceOf(Logger);
  });

  it("should create child logger", () => {
    const logger = new Logger().child("ParentService");
    const childLogger = logger.child("ChildService");

    expect(childLogger).toBeInstanceOf(Logger);
  });

  it("should have log methods", () => {
    const logger = new Logger().child("TestService");

    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });
});
