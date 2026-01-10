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
    if (args.length === 0) {
      this.pinoLogger.debug(message);
    } else {
      this.pinoLogger.debug({ data: args }, message);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (args.length === 0) {
      this.pinoLogger.info(message);
    } else {
      this.pinoLogger.info({ data: args }, message);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (args.length === 0) {
      this.pinoLogger.warn(message);
    } else {
      this.pinoLogger.warn({ data: args }, message);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (args.length === 0) {
      this.pinoLogger.error(message);
    } else {
      this.pinoLogger.error({ data: args }, message);
    }
  }
}
