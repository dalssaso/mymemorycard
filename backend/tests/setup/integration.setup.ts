/**
 * Integration Test Setup
 *
 * This file runs database migrations and seeds platforms before integration tests.
 * It ensures the test database has the complete schema and required seed data.
 *
 * Run integration tests with:
 * bun test --preload ./tests/setup/integration.setup.ts ./tests/integration
 *
 * CI service containers are configured to use localhost with port mapping.
 */

import "reflect-metadata";
import { beforeAll } from "bun:test";
import { runMigrations, seedStores, closeMigrationConnection } from "@/db";

/**
 * Retry logic for database operations with exponential backoff
 * Handles DNS resolution timing issues in CI environments
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 5,
  initialDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(
          `Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms...`,
          lastError.message
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Use beforeAll to ensure migrations run after test framework initializes
// Set timeout to 60 seconds to allow for retry attempts (default is 5 seconds)
beforeAll(
  async () => {
    console.log("Setting up integration tests...");

    // Retry migrations to handle DNS timing issues
    await retryWithBackoff(
      async () => {
        await runMigrations();
        await seedStores();
      },
      5,
      1000
    );

    await closeMigrationConnection();
    console.log("Integration test setup complete");
  },
  { timeout: 60000 }
);
