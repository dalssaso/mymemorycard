const isProduction = process.env.NODE_ENV === "production";

export const config = {
  port: Number(process.env.PORT) || 3000,

  database: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard",
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6380",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "dev-jwt-secret-change-in-production",
  },

  rawg: {
    apiKey: process.env.RAWG_API_KEY,
  },

  cors: {
    origin: process.env.ORIGIN,
    allowedOrigins: ["http://localhost:5173", "http://localhost:3000", process.env.ORIGIN].filter(
      Boolean
    ) as string[],
  },

  isProduction,
  skipRedisConnect: process.env.SKIP_REDIS_CONNECT === "1",
};
