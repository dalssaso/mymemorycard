import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard",
  },
  verbose: true,
  strict: true,
});
