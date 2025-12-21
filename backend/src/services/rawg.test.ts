import { describe, it, expect, beforeAll } from 'bun:test'
import { searchGames, getGameDetails } from './rawg'

describe('RAWG Service', () => {
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

      // Use a known game ID (The Witcher 3)
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
    it('should rate limit requests when API key is configured', async () => {
      if (!process.env.RAWG_API_KEY) {
        // Skip test if no API key
        return
      }

      const start = Date.now()
      
      // Make 3 requests
      await searchGames('Game 1')
      await searchGames('Game 2')
      await searchGames('Game 3')
      
      const duration = Date.now() - start
      
      // Should take at least 420ms (2 * 210ms between requests)
      expect(duration).toBeGreaterThanOrEqual(400)
    }, { timeout: 10000 })
  })
})
