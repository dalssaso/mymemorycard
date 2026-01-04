import { beforeAll, afterAll } from "bun:test";
import { pool } from "@/services/db";
import redisClient from "@/services/redis";

beforeAll(async () => {
  // Setup test database or use transactions
  console.log("Test setup: Database and Redis ready");
});

afterAll(async () => {
  // Cleanup
  await pool.end();
  await redisClient.quit();
  console.log("Test cleanup: Connections closed");
});
