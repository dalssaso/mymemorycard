/**
 * Integration Test Setup
 *
 * This file runs database migrations and seeds platforms before integration tests.
 * It ensures the test database has the complete schema and required seed data.
 *
 * Run integration tests with:
 * bun test --preload ./tests/setup/integration.setup.ts ./tests/integration
 */

import "reflect-metadata";
import { runMigrations, seedPlatforms, closeMigrationConnection } from "@/db";

// Run migrations and seed data before all integration tests
console.log("Setting up integration tests...");

await runMigrations();
await seedPlatforms();
await closeMigrationConnection();

console.log("Integration test setup complete");
