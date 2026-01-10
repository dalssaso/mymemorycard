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

  constructor(private context?: string) {
    this.pinoLogger = context ? pinoInstance.child({ context }) : pinoInstance;
  }

  child(context: string): Logger {
    return new Logger(context);
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
