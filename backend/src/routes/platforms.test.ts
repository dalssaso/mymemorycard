import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { pool } from '@/services/db'

describe('Platforms Routes', () => {
  let authToken: string
  const testEmail = 'platform@test.com'

  beforeAll(async () => {
    // Clean up and create test user
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail])
    
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'platformtester',
        email: testEmail,
        password: 'password123',
      }),
    })

    const data = (await registerResponse.json()) as { token: string }
    authToken = data.token
  })

  afterAll(async () => {
    // Cleanup
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail])
  })

  describe('GET /api/platforms', () => {
    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/platforms')
      expect(response.status).toBe(401)
    })

    it('should return all platforms', async () => {
      const response = await fetch('http://localhost:3000/api/platforms', {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      expect(response.status).toBe(200)
      const data = (await response.json()) as { platforms: any[] }
      expect(Array.isArray(data.platforms)).toBe(true)
      expect(data.platforms.length).toBeGreaterThan(0)
    })

    it('should return platforms with correct structure', async () => {
      const response = await fetch('http://localhost:3000/api/platforms', {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      const data = (await response.json()) as { platforms: any[] }
      const platform = data.platforms[0]
      
      expect(platform).toHaveProperty('id')
      expect(platform).toHaveProperty('name')
      expect(platform).toHaveProperty('display_name')
      expect(platform).toHaveProperty('platform_type')
    })

    it('should include steam, psn, xbox, and epic platforms', async () => {
      const response = await fetch('http://localhost:3000/api/platforms', {
        headers: { Authorization: `Bearer ${authToken}` },
      })

      const data = (await response.json()) as { platforms: Array<{ name: string }> }
      const platformNames = data.platforms.map((p) => p.name)
      
      expect(platformNames).toContain('steam')
      expect(platformNames).toContain('psn')
      expect(platformNames).toContain('xbox')
      expect(platformNames).toContain('epic')
    })
  })
})
