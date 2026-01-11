import pino from "pino";
import { injectable } from "tsyringe";

const isProd = process.env.NODE_ENV === "production";

const pinoInstance = pino({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      },
  timestamp: pino.stdTimeFunctions.isoTime,
});

@injectable()
export class Logger {
  private pinoLogger: pino.Logger;
  private context?: string;

  constructor() {
    this.pinoLogger = pinoInstance;
  }

  /**
   * Creates a child logger with chained context hierarchy.
   * Combines parent context with new context using ':' separator to show nesting.
   * Example: parent context "Auth" + child "Register" → "Auth:Register"
   * Parent log level and transports are inherited automatically via pinoInstance.
   */
  child(context: string): Logger {
    const chainedContext = this.context ? `${this.context}:${context}` : context;
    const childLogger = new Logger();
    childLogger.context = chainedContext;
    childLogger.pinoLogger = pinoInstance.child({ context: chainedContext });
    return childLogger;
  }

  debug(message: string, ...args: unknown[]): void {
    this.logWithArgs("debug", message, args);
  }

  info(message: string, ...args: unknown[]): void {
    this.logWithArgs("info", message, args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.logWithArgs("warn", message, args);
  }

  error(message: string, ...args: unknown[]): void {
    this.logWithArgs("error", message, args);
  }

  /**
   * Helper to handle variadic args for all log levels.
   * If no args provided, logs message only.
   * If args provided, logs message with data array.
   */
  private logWithArgs(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    args: unknown[]
  ): void {
    if (args.length === 0) {
      this.pinoLogger[level](message);
    } else {
      this.pinoLogger[level]({ data: args }, message);
    }
  }
}
