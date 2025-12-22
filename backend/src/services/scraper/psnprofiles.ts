import * as cheerio from 'cheerio'
import redisClient from '../redis'
import { query, queryOne } from '../db'

interface PSNProfilesData {
  difficulty_rating: number | null
  trophy_count_bronze: number | null
  trophy_count_silver: number | null
  trophy_count_gold: number | null
  trophy_count_platinum: number | null
  average_completion_time_hours: number | null
  psnprofiles_url: string | null
}

interface PSNProfilesRow {
  id: string
  game_id: string
  difficulty_rating: number | null
  trophy_count_bronze: number | null
  trophy_count_silver: number | null
  trophy_count_gold: number | null
  trophy_count_platinum: number | null
  average_completion_time_hours: number | null
  psnprofiles_url: string | null
  updated_at: Date
}

const PSNPROFILES_BASE_URL = 'https://psnprofiles.com'
const CACHE_TTL = 60 * 60 * 24 * 7 // 7 days

// Aggressive rate limiter: 1 request per 2 seconds to be respectful
class PSNProfilesRateLimiter {
  private queue: Array<() => void> = []
  private processing = false
  private lastRequestTime = 0
  private minInterval = 2000 // 2 seconds between requests

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      if (!this.processing) {
        this.processQueue()
      }
    })
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false
      return
    }

    this.processing = true
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < this.minInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      )
    }

    const task = this.queue.shift()
    this.lastRequestTime = Date.now()

    if (task) {
      await task()
    }

    this.processQueue()
  }
}

const rateLimiter = new PSNProfilesRateLimiter()

/**
 * Search for a game on PSNProfiles by name
 * Returns the URL of the best match, or null if no match found
 */
async function searchGame(gameName: string): Promise<string | null> {
  return rateLimiter.schedule(async () => {
    try {
      // PSNProfiles search URL
      const searchUrl = `${PSNPROFILES_BASE_URL}/search/games?q=${encodeURIComponent(gameName)}`
      
      console.log(`PSNProfiles search: ${gameName}`)
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (!response.ok) {
        console.error(`PSNProfiles search failed: ${response.status}`)
        return null
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Find the first game result
      // PSNProfiles search results are in a table with class 'zebra'
      const firstResult = $('.zebra tbody tr').first()
      
      if (firstResult.length === 0) {
        console.log(`No PSNProfiles results for: ${gameName}`)
        return null
      }

      // Extract the game URL from the first result
      const gameLink = firstResult.find('td a').attr('href')
      
      if (!gameLink) {
        return null
      }

      // Construct full URL
      const gameUrl = gameLink.startsWith('http') 
        ? gameLink 
        : `${PSNPROFILES_BASE_URL}${gameLink}`

      console.log(`PSNProfiles match found: ${gameUrl}`)
      return gameUrl
    } catch (error) {
      console.error('PSNProfiles search error:', error)
      return null
    }
  })
}

/**
 * Scrape game data from a PSNProfiles game page
 */
async function scrapeGamePage(gameUrl: string): Promise<Omit<PSNProfilesData, 'psnprofiles_url'> | null> {
  return rateLimiter.schedule(async () => {
    try {
      console.log(`Scraping PSNProfiles page: ${gameUrl}`)
      const response = await fetch(gameUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (!response.ok) {
        console.error(`PSNProfiles page fetch failed: ${response.status}`)
        return null
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Extract difficulty rating (usually shown as X/10)
      let difficultyRating: number | null = null
      const difficultyText = $('.gamestat .typo-top').first().text()
      const difficultyMatch = difficultyText.match(/(\d+(\.\d+)?)\/10/)
      if (difficultyMatch) {
        difficultyRating = parseFloat(difficultyMatch[1])
      }

      // Extract trophy counts
      // PSNProfiles shows trophy counts in the sidebar
      let bronzeCount: number | null = null
      let silverCount: number | null = null
      let goldCount: number | null = null
      let platinumCount: number | null = null

      // Trophy counts are typically in elements with trophy icons
      $('.trophy-count, .trophy').each((_, elem) => {
        const text = $(elem).text().trim()
        const iconClass = $(elem).attr('class') || ''
        
        if (iconClass.includes('bronze') || $(elem).find('.bronze').length > 0) {
          const match = text.match(/(\d+)/)
          if (match) bronzeCount = parseInt(match[1])
        } else if (iconClass.includes('silver') || $(elem).find('.silver').length > 0) {
          const match = text.match(/(\d+)/)
          if (match) silverCount = parseInt(match[1])
        } else if (iconClass.includes('gold') || $(elem).find('.gold').length > 0) {
          const match = text.match(/(\d+)/)
          if (match) goldCount = parseInt(match[1])
        } else if (iconClass.includes('platinum') || $(elem).find('.platinum').length > 0) {
          const match = text.match(/(\d+)/)
          if (match) platinumCount = parseInt(match[1])
        }
      })

      // Alternative: Look for trophy stats in the stats box
      if (!bronzeCount) {
        $('.stats .row').each((_, elem) => {
          const label = $(elem).find('.typo-top-date, .stat').first().text().toLowerCase()
          const value = $(elem).find('.typo-top, li').first().text()
          const count = parseInt(value.match(/(\d+)/)?.[1] || '0')
          
          if (label.includes('bronze')) bronzeCount = count
          else if (label.includes('silver')) silverCount = count
          else if (label.includes('gold')) goldCount = count
          else if (label.includes('platinum')) platinumCount = count
        })
      }

      // Extract average completion time
      // Usually shown as "XX hours" or "XX hours, YY mins"
      let completionTimeHours: number | null = null
      $('.gamestat, .stats').each((_, elem) => {
        const text = $(elem).text()
        
        // Look for patterns like "15 hours" or "15h 30m"
        const hoursMatch = text.match(/(\d+)\s*(?:hours?|hrs?|h)/i)
        const minsMatch = text.match(/(\d+)\s*(?:minutes?|mins?|m)/i)
        
        if (hoursMatch) {
          let hours = parseInt(hoursMatch[1])
          if (minsMatch) {
            hours += parseInt(minsMatch[1]) / 60
          }
          completionTimeHours = hours
        }
      })

      return {
        difficulty_rating: difficultyRating,
        trophy_count_bronze: bronzeCount,
        trophy_count_silver: silverCount,
        trophy_count_gold: goldCount,
        trophy_count_platinum: platinumCount,
        average_completion_time_hours: completionTimeHours
      }
    } catch (error) {
      console.error('PSNProfiles scrape error:', error)
      return null
    }
  })
}

/**
 * Get PSNProfiles data for a game (with caching)
 */
export async function getPSNProfilesData(
  gameName: string, 
  useCache = true
): Promise<PSNProfilesData | null> {
  // Check cache first
  if (useCache) {
    const cached = await getCachedData(gameName)
    if (cached) {
      console.log(`Cache hit for PSNProfiles: ${gameName}`)
      return cached
    }
  }

  // Search for the game
  const gameUrl = await searchGame(gameName)
  
  if (!gameUrl) {
    return null
  }

  // Scrape the game page
  const data = await scrapeGamePage(gameUrl)
  
  if (!data) {
    return null
  }

  const result: PSNProfilesData = {
    ...data,
    psnprofiles_url: gameUrl
  }

  // Cache the results
  if (useCache) {
    await cacheData(gameName, result)
  }

  return result
}

// Redis caching functions
async function getCachedData(gameName: string): Promise<PSNProfilesData | null> {
  try {
    const key = `psnprofiles:${gameName.toLowerCase()}`
    const cached = await redisClient.get(key)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error('Redis cache get error:', error)
    return null
  }
}

async function cacheData(gameName: string, data: PSNProfilesData): Promise<void> {
  try {
    const key = `psnprofiles:${gameName.toLowerCase()}`
    await redisClient.setEx(key, CACHE_TTL, JSON.stringify(data))
  } catch (error) {
    console.error('Redis cache set error:', error)
  }
}

/**
 * Save PSNProfiles data to database
 */
export async function savePSNProfilesData(
  gameId: string,
  data: PSNProfilesData
): Promise<void> {
  const sql = `
    INSERT INTO psnprofiles_data (
      game_id,
      difficulty_rating,
      trophy_count_bronze,
      trophy_count_silver,
      trophy_count_gold,
      trophy_count_platinum,
      average_completion_time_hours,
      psnprofiles_url,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    ON CONFLICT (game_id) 
    DO UPDATE SET
      difficulty_rating = EXCLUDED.difficulty_rating,
      trophy_count_bronze = EXCLUDED.trophy_count_bronze,
      trophy_count_silver = EXCLUDED.trophy_count_silver,
      trophy_count_gold = EXCLUDED.trophy_count_gold,
      trophy_count_platinum = EXCLUDED.trophy_count_platinum,
      average_completion_time_hours = EXCLUDED.average_completion_time_hours,
      psnprofiles_url = EXCLUDED.psnprofiles_url,
      updated_at = NOW()
  `

  await query(sql, [
    gameId,
    data.difficulty_rating,
    data.trophy_count_bronze,
    data.trophy_count_silver,
    data.trophy_count_gold,
    data.trophy_count_platinum,
    data.average_completion_time_hours,
    data.psnprofiles_url
  ])

  console.log(`Saved PSNProfiles data for game ${gameId}`)
}

/**
 * Get PSNProfiles data from database
 */
export async function getPSNProfilesDataFromDB(
  gameId: string
): Promise<PSNProfilesData | null> {
  const sql = `
    SELECT 
      difficulty_rating,
      trophy_count_bronze,
      trophy_count_silver,
      trophy_count_gold,
      trophy_count_platinum,
      average_completion_time_hours,
      psnprofiles_url
    FROM psnprofiles_data
    WHERE game_id = $1
  `

  const row = await queryOne<PSNProfilesData>(sql, [gameId])
  return row
}

/**
 * Fetch and save PSNProfiles data for a game
 * This is the main function to call for refreshing metadata
 */
export async function fetchAndSavePSNProfilesData(
  gameId: string,
  gameName: string
): Promise<PSNProfilesData | null> {
  // Fetch fresh data from PSNProfiles
  const data = await getPSNProfilesData(gameName, false)
  
  if (!data) {
    console.log(`No PSNProfiles data found for: ${gameName}`)
    return null
  }

  // Save to database
  await savePSNProfilesData(gameId, data)

  return data
}

export type { PSNProfilesData, PSNProfilesRow }
