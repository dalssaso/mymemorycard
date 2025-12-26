/**
 * Unit Tests: CORS Middleware
 *
 * Tests the CORS middleware functionality without any external dependencies.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { corsHeaders, handleCors } from '@/middleware/cors'

describe('CORS Middleware', () => {
  const originalEnv = process.env.ORIGIN

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ORIGIN = originalEnv
    } else {
      delete process.env.ORIGIN
    }
  })

  describe('corsHeaders', () => {
    it('should return CORS headers with allowed origin', () => {
      const headers = corsHeaders('http://localhost:5173')

      expect(headers['Access-Control-Allow-Origin']).toBe(
        'http://localhost:5173'
      )
      expect(headers['Access-Control-Allow-Methods']).toBe(
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      )
      expect(headers['Access-Control-Allow-Headers']).toBe(
        'Content-Type, Authorization'
      )
      expect(headers['Access-Control-Allow-Credentials']).toBe('true')
    })

    it('should return first allowed origin for unknown origin', () => {
      const headers = corsHeaders('http://unknown.com')

      expect(headers['Access-Control-Allow-Origin']).toBe(
        'http://localhost:5173'
      )
    })

    it('should return first allowed origin when no origin provided', () => {
      const headers = corsHeaders()

      expect(headers['Access-Control-Allow-Origin']).toBe(
        'http://localhost:5173'
      )
    })

    it('should allow localhost:3000', () => {
      const headers = corsHeaders('http://localhost:3000')

      expect(headers['Access-Control-Allow-Origin']).toBe(
        'http://localhost:3000'
      )
    })

    it('should allow custom ORIGIN from env', () => {
      process.env.ORIGIN = 'https://myapp.com'

      const headers = corsHeaders('https://myapp.com')

      expect(headers['Access-Control-Allow-Origin']).toBe('https://myapp.com')
    })
  })

  describe('handleCors', () => {
    it('should return 204 response for OPTIONS request', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:5173',
        },
      })

      const response = handleCors(request)

      expect(response).not.toBeNull()
      expect(response?.status).toBe(204)
    })

    it('should include CORS headers in OPTIONS response', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:5173',
        },
      })

      const response = handleCors(request)

      expect(response?.headers.get('Access-Control-Allow-Origin')).toBe(
        'http://localhost:5173'
      )
      expect(response?.headers.get('Access-Control-Allow-Methods')).toBe(
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      )
    })

    it('should return null for non-OPTIONS request', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'GET',
      })

      const response = handleCors(request)

      expect(response).toBeNull()
    })

    it('should return null for POST request', () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
      })

      const response = handleCors(request)

      expect(response).toBeNull()
    })
  })
})
