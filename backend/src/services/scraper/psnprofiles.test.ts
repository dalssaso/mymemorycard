import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { query } from '../db'
import { 
  getPSNProfilesData, 
  savePSNProfilesData, 
  getPSNProfilesDataFromDB,
  fetchAndSavePSNProfilesData 
} from './psnprofiles'

describe('PSNProfiles Scraper', () => {
  let testGameId: string

  beforeAll(async () => {
    // Create a test game
    const result = await query(
      `INSERT INTO games (name, slug) 
       VALUES ($1, $2) 
       RETURNING id`,
      ['Test Game', 'test-game']
    )
    testGameId = result.rows[0].id
  })

  afterAll(async () => {
    // Clean up test data
    await query('DELETE FROM psnprofiles_data WHERE game_id = $1', [testGameId])
    await query('DELETE FROM games WHERE id = $1', [testGameId])
  })

  describe('savePSNProfilesData', () => {
    it('should save PSNProfiles data to database', async () => {
      const testData = {
        difficulty_rating: 7.5,
        trophy_count_bronze: 30,
        trophy_count_silver: 15,
        trophy_count_gold: 5,
        trophy_count_platinum: 1,
        average_completion_time_hours: 40.5,
        psnprofiles_url: 'https://psnprofiles.com/test-game'
      }

      await savePSNProfilesData(testGameId, testData)

      // Verify data was saved
      const saved = await getPSNProfilesDataFromDB(testGameId)
      expect(saved).not.toBeNull()
      expect(saved?.difficulty_rating).toBe(7.5)
      expect(saved?.trophy_count_bronze).toBe(30)
      expect(saved?.trophy_count_silver).toBe(15)
      expect(saved?.trophy_count_gold).toBe(5)
      expect(saved?.trophy_count_platinum).toBe(1)
      expect(saved?.average_completion_time_hours).toBe(40.5)
      expect(saved?.psnprofiles_url).toBe('https://psnprofiles.com/test-game')
    })

    it('should update existing PSNProfiles data', async () => {
      // First insert
      await savePSNProfilesData(testGameId, {
        difficulty_rating: 5.0,
        trophy_count_bronze: 20,
        trophy_count_silver: 10,
        trophy_count_gold: 3,
        trophy_count_platinum: 1,
        average_completion_time_hours: 30.0,
        psnprofiles_url: 'https://psnprofiles.com/test-game-old'
      })

      // Update
      await savePSNProfilesData(testGameId, {
        difficulty_rating: 8.0,
        trophy_count_bronze: 25,
        trophy_count_silver: 12,
        trophy_count_gold: 4,
        trophy_count_platinum: 1,
        average_completion_time_hours: 35.5,
        psnprofiles_url: 'https://psnprofiles.com/test-game-new'
      })

      const saved = await getPSNProfilesDataFromDB(testGameId)
      expect(saved?.difficulty_rating).toBe(8.0)
      expect(saved?.trophy_count_bronze).toBe(25)
      expect(saved?.psnprofiles_url).toBe('https://psnprofiles.com/test-game-new')
    })

    it('should handle null values', async () => {
      await savePSNProfilesData(testGameId, {
        difficulty_rating: null,
        trophy_count_bronze: null,
        trophy_count_silver: null,
        trophy_count_gold: null,
        trophy_count_platinum: null,
        average_completion_time_hours: null,
        psnprofiles_url: null
      })

      const saved = await getPSNProfilesDataFromDB(testGameId)
      expect(saved).not.toBeNull()
      expect(saved?.difficulty_rating).toBeNull()
      expect(saved?.trophy_count_bronze).toBeNull()
    })
  })

  describe('getPSNProfilesDataFromDB', () => {
    it('should return null for non-existent game', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const result = await getPSNProfilesDataFromDB(fakeId)
      expect(result).toBeNull()
    })

    it('should retrieve saved data', async () => {
      const testData = {
        difficulty_rating: 6.5,
        trophy_count_bronze: 35,
        trophy_count_silver: 18,
        trophy_count_gold: 6,
        trophy_count_platinum: 1,
        average_completion_time_hours: 45.0,
        psnprofiles_url: 'https://psnprofiles.com/test-retrieve'
      }

      await savePSNProfilesData(testGameId, testData)
      const retrieved = await getPSNProfilesDataFromDB(testGameId)

      expect(retrieved).not.toBeNull()
      expect(retrieved?.difficulty_rating).toBe(6.5)
      expect(retrieved?.trophy_count_bronze).toBe(35)
    })
  })

  describe('getPSNProfilesData (scraper)', () => {
    it('should respect rate limiting', async () => {
      // This test verifies that the rate limiter works by measuring time
      const start = Date.now()
      
      // Make two consecutive calls (should be rate limited to 2 seconds apart)
      await getPSNProfilesData('Nonexistent Game Test 1', false)
      await getPSNProfilesData('Nonexistent Game Test 2', false)
      
      const elapsed = Date.now() - start
      
      // Should take at least 2 seconds due to rate limiting
      expect(elapsed).toBeGreaterThanOrEqual(2000)
    }, 10000) // 10 second timeout for this test

    it('should return null for non-existent games', async () => {
      const result = await getPSNProfilesData('This Game Definitely Does Not Exist 12345', false)
      expect(result).toBeNull()
    }, 10000)
  })

  describe('fetchAndSavePSNProfilesData', () => {
    it('should fetch and save data in one operation', async () => {
      // Use a game that likely won't be found to avoid actual web scraping in tests
      const result = await fetchAndSavePSNProfilesData(
        testGameId, 
        'Nonexistent Game For Testing 99999'
      )

      // Should return null since game doesn't exist
      expect(result).toBeNull()
    }, 10000)
  })
})
