import { injectable } from "tsyringe";
import type { IConfig } from "./config.interface";

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
        max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : undefined,
        idleTimeout: process.env.DB_POOL_IDLE_TIMEOUT
          ? Number(process.env.DB_POOL_IDLE_TIMEOUT)
          : undefined,
        connectTimeout: process.env.DB_POOL_CONNECT_TIMEOUT
          ? Number(process.env.DB_POOL_CONNECT_TIMEOUT)
          : undefined,
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
    this.rawg = { apiKey: this.requireEnv("RAWG_API_KEY") };
    this.encryption = {
      secret: this.requireEnv("ENCRYPTION_SECRET"),
      salt: this.requireEnv("ENCRYPTION_SALT"),
    };

    // Optional with defaults
    this.port = Number(process.env.PORT) || 3000;
    this.bcrypt = {
      saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
    };

    const origin = process.env.ORIGIN;
    this.cors = {
      origin,
      allowedOrigins: [
        "http://localhost:5173",
        "http://localhost:3000",
        ...(origin ? [origin] : []),
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
