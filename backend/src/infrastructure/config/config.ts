import { injectable } from "tsyringe";
import type { IConfig } from "./config.interface";

/**
 * Parses and validates a positive integer from string.
 * Throws if value is not a valid positive integer.
 */
function parsePositiveInt(value: string | undefined, key: string): number | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer (got "${value}", parsed as ${parsed})`);
  }

  return parsed;
}

/**
 * Gets optional environment variable.
 * Returns undefined if not set or empty, otherwise returns the value.
 */
function optionalEnv(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim() !== "" ? value : undefined;
}

@injectable()
export class Config implements IConfig {
  readonly database: {
    url: string;
    pool?: {
      max?: number;
      idleTimeout?: number;
      connectTimeout?: number;
    };
  };
  readonly redis: { url: string };
  readonly jwt: { secret: string; expiresIn: string };
  readonly rawg: { apiKey: string };
  readonly encryption: { secret: string; salt: string };
  readonly port: number;
  readonly cors: { origin?: string; allowedOrigins: string[] };
  readonly bcrypt: { saltRounds: number };
  readonly isProduction: boolean;
  readonly skipRedisConnect: boolean;

  constructor() {
    // Determine environment first
    this.isProduction = process.env.NODE_ENV === "production";
    this.skipRedisConnect = process.env.SKIP_REDIS_CONNECT === "1";

    // Validate required vars - throws if missing
    this.database = {
      url: this.requireEnv("DATABASE_URL"),
      pool: {
        max: parsePositiveInt(process.env.DB_POOL_MAX, "DB_POOL_MAX"),
        idleTimeout: parsePositiveInt(process.env.DB_POOL_IDLE_TIMEOUT, "DB_POOL_IDLE_TIMEOUT"),
        connectTimeout: parsePositiveInt(
          process.env.DB_POOL_CONNECT_TIMEOUT,
          "DB_POOL_CONNECT_TIMEOUT"
        ),
      },
    };
    this.redis = { url: this.requireEnv("REDIS_URL") };
    const jwtSecret = this.requireEnv("JWT_SECRET");

    // Validate JWT secret length in production
    if (this.isProduction && jwtSecret.length < 32) {
      throw new Error(
        `JWT_SECRET must be at least 32 characters in production (current length: ${jwtSecret.length})`
      );
    }

    this.jwt = {
      secret: jwtSecret,
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    };

    // RAWG_API_KEY is optional - rawg.ts supports graceful degradation
    // Returns empty string for optional variable (type requires string)
    this.rawg = { apiKey: optionalEnv("RAWG_API_KEY") || "" };

    const encryptionSecret = this.requireEnv("ENCRYPTION_SECRET");
    const encryptionSalt = this.requireEnv("ENCRYPTION_SALT");

    // Validate encryption secret and salt minimum length
    if (encryptionSecret.length < 32) {
      throw new Error(
        `ENCRYPTION_SECRET must be at least 32 characters (current length: ${encryptionSecret.length})`
      );
    }

    if (encryptionSalt.length < 16) {
      throw new Error(
        `ENCRYPTION_SALT must be at least 16 characters (current length: ${encryptionSalt.length})`
      );
    }

    this.encryption = {
      secret: encryptionSecret,
      salt: encryptionSalt,
    };

    // Optional with defaults - validate as positive integers
    this.port = parsePositiveInt(process.env.PORT, "PORT") || 3000;
    this.bcrypt = {
      saltRounds: parsePositiveInt(process.env.BCRYPT_SALT_ROUNDS, "BCRYPT_SALT_ROUNDS") || 10,
    };

    // Validate ORIGIN if provided - must be a valid origin URL with protocol and hostname
    let validatedOrigin: string | undefined;
    const origin = process.env.ORIGIN;

    if (origin) {
      try {
        const urlObj = new URL(origin);

        // Ensure no path component (origin should not include paths)
        if (urlObj.pathname !== "/" || urlObj.search || urlObj.hash) {
          throw new Error("Origin URL must not include path, query, or fragment");
        }

        validatedOrigin = origin;
      } catch (error) {
        throw new Error(
          `Invalid ORIGIN configuration: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    this.cors = {
      origin: validatedOrigin,
      allowedOrigins: [
        "http://localhost:5173",
        "http://localhost:3000",
        ...(validatedOrigin ? [validatedOrigin] : []),
      ],
    };
  }

  private requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }
}
