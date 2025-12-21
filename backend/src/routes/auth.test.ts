import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { pool } from '@/services/db'

describe('Auth Routes', () => {
  beforeAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['%@test.com'])
  })

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['%@test.com'])
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser',
          email: 'testuser@test.com',
          password: 'password123',
        }),
      })

      const data = await response.json() as { user: { email: string }; token: string }

      expect(response.status).toBe(201)
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe('testuser@test.com')
      expect(data.token).toBeDefined()
    })

    it('should reject registration with existing email', async () => {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser2',
          email: 'testuser@test.com',
          password: 'password123',
        }),
      })

      expect(response.status).toBe(409)
    })

    it('should reject registration with weak password', async () => {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'testuser3',
          email: 'testuser3@test.com',
          password: '123',
        }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'testuser@test.com',
          password: 'password123',
        }),
      })

      const data = await response.json() as { user: { email: string }; token: string }

      expect(response.status).toBe(200)
      expect(data.user).toBeDefined()
      expect(data.token).toBeDefined()
    })

    it('should reject login with invalid password', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'testuser@test.com',
          password: 'wrongpassword',
        }),
      })

      expect(response.status).toBe(401)
    })

    it('should reject login with non-existent email', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@test.com',
          password: 'password123',
        }),
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return user data with valid token', async () => {
      // First login to get token
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'testuser@test.com',
          password: 'password123',
        }),
      })

      const { token } = await loginResponse.json() as { token: string }

      // Then test /me endpoint
      const response = await fetch('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json() as { user: { email: string } }

      expect(response.status).toBe(200)
      expect(data.user.email).toBe('testuser@test.com')
    })

    it('should reject request without token', async () => {
      const response = await fetch('http://localhost:3000/api/auth/me')

      expect(response.status).toBe(401)
    })

    it('should reject request with invalid token', async () => {
      const response = await fetch('http://localhost:3000/api/auth/me', {
        headers: { Authorization: 'Bearer invalid-token' },
      })

      expect(response.status).toBe(401)
    })
  })
})
