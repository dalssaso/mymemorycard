/**
 * Integration Tests: RAWG Service
 *
 * These tests require the RAWG_API_KEY environment variable
 * to be set to make real API calls.
 */

import { describe, it, expect, beforeAll } from 'bun:test'
import { searchGames, getGameDetails } from '@/services/rawg'

describe('RAWG Service (integration)', () => {
  beforeAll(() => {
    if (!process.env.RAWG_API_KEY) {
      console.warn('RAWG_API_KEY not set, tests will return empty results')
    }
  })

  describe('searchGames', () => {
    it('should return an array', async () => {
      const results = await searchGames('Witcher')
      expect(Array.isArray(results)).toBe(true)
    })

    it('should limit results to 5', async () => {
      const results = await searchGames('The')
      expect(results.length).toBeLessThanOrEqual(5)
    })

    it('should return game objects with expected properties', async () => {
      const results = await searchGames('Witcher 3')

      if (results.length > 0) {
        const game = results[0]
        expect(game).toHaveProperty('id')
        expect(game).toHaveProperty('name')
        expect(game).toHaveProperty('slug')
        expect(typeof game.id).toBe('number')
        expect(typeof game.name).toBe('string')
      }
    })

    it('should handle empty search query', async () => {
      const results = await searchGames('')
      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('getGameDetails', () => {
    it('should return null for invalid game ID', async () => {
      const result = await getGameDetails(999999999)
      expect(result).toBeNull()
    })

    it('should return game details if API key is configured', async () => {
      if (!process.env.RAWG_API_KEY) {
        return
      }

      const result = await getGameDetails(3328)

      if (result) {
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('name')
        expect(result).toHaveProperty('description_raw')
        expect(result.id).toBe(3328)
      }
    })
  })

  describe('Rate Limiting', () => {
    it(
      'should rate limit requests when API key is configured',
      async () => {
        if (!process.env.RAWG_API_KEY) {
          return
        }

        const uniqueId = Date.now()
        const start = Date.now()

        await searchGames(`RateLimitTest${uniqueId}A`)
        await searchGames(`RateLimitTest${uniqueId}B`)
        await searchGames(`RateLimitTest${uniqueId}C`)

        const duration = Date.now() - start

        expect(duration).toBeGreaterThanOrEqual(400)
      },
      { timeout: 10000 }
    )
  })
})
