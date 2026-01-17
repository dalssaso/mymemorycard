import { describe, it, expect } from 'vitest'

import { adaptGameResponse, adaptGamesListResponse } from '../games'

describe('Games Adapters', () => {
  describe('adaptGameResponse', () => {
    it('should normalize legacy camelCase to snake_case', () => {
      const legacyGame = {
        id: 'game-1',
        name: 'Test Game',
        coverArtUrl: '/images/cover.jpg',
        platformId: 'platform-1',
        storeId: 'store-1',
        igdbId: 12345,
        metadataSource: 'igdb',
      }

      const result = adaptGameResponse(legacyGame)

      expect(result).toEqual({
        id: 'game-1',
        name: 'Test Game',
        cover_art_url: '/images/cover.jpg',
        platform_id: 'platform-1',
        store_id: 'store-1',
        igdb_id: 12345,
        metadata_source: 'igdb',
      })
    })

    it('should handle null values gracefully', () => {
      const legacyGame = {
        id: 'game-1',
        name: 'Test Game',
        coverArtUrl: null,
        platformId: null,
      }

      const result = adaptGameResponse(legacyGame)

      expect(result.cover_art_url).toBeNull()
      expect(result.platform_id).toBeNull()
    })

    it('should handle undefined values gracefully', () => {
      const legacyGame = {
        id: 'game-1',
        name: 'Test Game',
      }

      const result = adaptGameResponse(legacyGame)

      expect(result.cover_art_url).toBeNull()
      expect(result.platform_id).toBeNull()
    })
  })

  describe('adaptGamesListResponse', () => {
    it('should adapt array of games', () => {
      const legacyGames = [
        {
          id: 'game-1',
          name: 'Game 1',
          coverArtUrl: '/cover1.jpg',
          platformId: 'platform-1',
        },
        {
          id: 'game-2',
          name: 'Game 2',
          coverArtUrl: '/cover2.jpg',
          platformId: 'platform-2',
        },
      ]

      const result = adaptGamesListResponse(legacyGames)

      expect(result).toHaveLength(2)
      expect(result[0].cover_art_url).toBe('/cover1.jpg')
      expect(result[1].cover_art_url).toBe('/cover2.jpg')
    })

    it('should return empty array for empty input', () => {
      const result = adaptGamesListResponse([])
      expect(result).toEqual([])
    })
  })
})
