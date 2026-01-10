import { injectable } from "tsyringe";
import type { IConfig } from "./config.interface";

@injectable()
export class Config implements IConfig {
  readonly database: { url: string };
  readonly redis: { url: string };
  readonly jwt: { secret: string };
  readonly rawg: { apiKey: string };
  readonly port: number;
  readonly cors: { origin?: string; allowedOrigins: string[] };
  readonly bcrypt: { saltRounds: number };
  readonly isProduction: boolean;
  readonly skipRedisConnect: boolean;

  constructor() {
    // Validate required vars - throws if missing
    this.database = { url: this.requireEnv("DATABASE_URL") };
    this.redis = { url: this.requireEnv("REDIS_URL") };
    this.jwt = { secret: this.requireEnv("JWT_SECRET") };
    this.rawg = { apiKey: this.requireEnv("RAWG_API_KEY") };

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

    // Derived
    this.isProduction = process.env.NODE_ENV === "production";
    this.skipRedisConnect = process.env.SKIP_REDIS_CONNECT === "1";
  }

  private requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }
}
