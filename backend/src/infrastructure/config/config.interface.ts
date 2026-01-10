export interface IConfig {
  // Required - will throw if missing
  readonly database: { url: string };
  readonly redis: { url: string };
  readonly jwt: { secret: string };
  readonly rawg: { apiKey: string };
  readonly encryption: { secret: string; salt: string };

  // Optional - have defaults
  readonly port: number;
  readonly cors: {
    origin?: string;
    allowedOrigins: string[];
  };
  readonly bcrypt: { saltRounds: number };

  // Derived
  readonly isProduction: boolean;
  readonly skipRedisConnect: boolean;
}
