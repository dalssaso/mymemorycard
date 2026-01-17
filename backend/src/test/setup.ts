import "reflect-metadata";
import { beforeAll, afterAll } from "bun:test";
import { pool } from "@/services/db";
import { container, registerDependencies } from "@/container";
import type { IRedisConnection } from "@/infrastructure/redis/connection.interface";
import { REDIS_CONNECTION_TOKEN } from "@/container/tokens";

beforeAll(async () => {
  // Register DI dependencies for tests
  registerDependencies();
  console.log("Test setup: Database and Redis ready");
});

afterAll(async () => {
  // Cleanup using DI-managed connections
  await pool.end();
  const redisConnection = container.resolve<IRedisConnection>(REDIS_CONNECTION_TOKEN);
  await redisConnection.close();
  console.log("Test cleanup: Connections closed");
});
