import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { pool } from '@/services/db'

describe('Import Routes', () => {
  let authToken: string
  let userId: string

  beforeAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['%@import-test.com'])

    // Create test user
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'importtester',
        email: 'importtest@import-test.com',
        password: 'password123',
      }),
    })

    const data = (await registerResponse.json()) as { user: { id: string }; token: string }
    authToken = data.token
    userId = data.user.id
  })

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM users WHERE id = $1', [userId])
  })

  describe('POST /api/import/bulk', () => {
    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/import/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameNames: ['Test Game'] }),
      })

      expect(response.status).toBe(401)
    })

    it('should validate gameNames parameter', async () => {
      const response = await fetch('http://localhost:3000/api/import/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      })

      expect(response.status).toBe(400)
      const data = (await response.json()) as { error: string }
      expect(data.error).toContain('gameNames')
    })

    it('should accept gameNames array', async () => {
      const response = await fetch('http://localhost:3000/api/import/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ gameNames: ['Test Game 1', 'Test Game 2'] }),
      })

      expect(response.status).toBe(200)
      const data = (await response.json()) as { imported: any[]; needsReview: any[] }
      expect(data).toHaveProperty('imported')
      expect(data).toHaveProperty('needsReview')
    })

    it('should accept optional platformId', async () => {
      // Get a platform
      const platformsResponse = await fetch('http://localhost:3000/api/platforms', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const platformsData = (await platformsResponse.json()) as {
        platforms: Array<{ id: string }>
      }
      const platformId = platformsData.platforms[0].id

      const response = await fetch('http://localhost:3000/api/import/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ gameNames: ['Test Game 3'], platformId }),
      })

      expect(response.status).toBe(200)
    })
  })
})
