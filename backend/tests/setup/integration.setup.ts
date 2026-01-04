/**
 * Integration Test Setup
 *
 * This file provides helpers for integration tests that run against
 * real database and redis services via docker-compose.
 *
 * Prerequisites:
 * - docker compose up -d (postgres and redis running)
 * - Backend server running on localhost:3000
 *
 * Environment variables:
 * - API_BASE_URL: Base URL for API calls (default: http://localhost:3000)
 * - TEST_DATABASE_URL: PostgreSQL connection string for test setup/cleanup
 *   (default: postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard)
 */

import pg from 'pg'

const { Pool } = pg

export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'

/**
 * Test database connection pool.
 * Uses TEST_DATABASE_URL if set, otherwise defaults to local Docker postgres on port 5433.
 * This is separate from the application's pool to allow running tests from the host
 * against a backend running either locally or in Docker.
 */
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ||
  'postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard'

export const testPool = new Pool({
  connectionString: testDatabaseUrl,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

/**
 * Helper to make authenticated API requests
 */
export async function fetchWithAuth(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}

/**
 * Helper to create a test user and get auth token
 */
export async function createTestUser(
  email: string,
  password = 'password123'
): Promise<{ token: string; userId: string }> {
  const username = email.split('@')[0]

  let response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })

  // If user exists, try to login
  if (response.status === 409) {
    response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  }

  const data = (await response.json()) as { token: string; user: { id: string } }
  return { token: data.token, userId: data.user.id }
}

/**
 * Wait for the backend to be ready
 */
export async function waitForBackend(maxRetries = 30, delayMs = 1000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`)
      if (response.ok) {
        return true
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  return false
}

/**
 * Clean up test pool connections after all tests
 */
export async function closeTestPool(): Promise<void> {
  await testPool.end()
}
