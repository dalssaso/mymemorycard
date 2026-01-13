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

  describe("context chaining", () => {
    it("should compose context strings with colon separator", () => {
      const logger = new Logger();
      const parent = logger.child("Parent");
      const child = parent.child("Child");
      const grandchild = child.child("Grandchild");

      // Access private context property for testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((parent as any).context).toBe("Parent");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((child as any).context).toBe("Parent:Child");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((grandchild as any).context).toBe("Parent:Child:Grandchild");
    });

    it("should pass chained context to pino child logger", () => {
      const logger = new Logger();
      const parent = logger.child("Service");
      const child = parent.child("Method");

      // Verify the logger has the expected context
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((child as any).context).toBe("Service:Method");
    });
  });
});
