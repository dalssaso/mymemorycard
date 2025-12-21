interface RAWGGame {
  id: number
  name: string
  slug: string
  released: string | null
  background_image: string | null
  rating: number
  metacritic: number | null
  genres: Array<{ id: number; name: string }>
  platforms: Array<{
    platform: { id: number; name: string; slug: string }
  }>
  esrb_rating: { id: number; name: string; slug: string } | null
  description_raw?: string
}

interface RAWGSearchResponse {
  count: number
  results: RAWGGame[]
}

const RAWG_API_KEY = process.env.RAWG_API_KEY
const RAWG_BASE_URL = 'https://api.rawg.io/api'

// Rate limiter to stay under RAWG's 5 req/sec limit
class RateLimiter {
  private queue: Array<() => void> = []
  private processing = false
  private lastRequestTime = 0
  private minInterval = 210 // 210ms = ~4.7 req/sec (safe margin)

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

const rateLimiter = new RateLimiter()

export async function searchGames(query: string, useCache = true): Promise<RAWGGame[]> {
  if (!RAWG_API_KEY) {
    console.warn('RAWG API key not configured')
    return []
  }

  // Check cache first
  if (useCache) {
    const cached = await getCachedSearch(query)
    if (cached) {
      console.log(`Cache hit for search: ${query}`)
      return cached
    }
  }

  return rateLimiter.schedule(async () => {
    const url = new URL(`${RAWG_BASE_URL}/games`)
    url.searchParams.set('key', RAWG_API_KEY!)
    url.searchParams.set('search', query)
    url.searchParams.set('page_size', '5')

    console.log(`RAWG API request: search "${query}"`)
    await incrementRAWGRequestCount() // Track API usage
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`)
    }

    const data = (await response.json()) as RAWGSearchResponse
    
    // Cache the results
    if (useCache) {
      await cacheSearch(query, data.results)
    }
    
    return data.results
  })
}

export async function getGameDetails(gameId: number, useCache = true): Promise<RAWGGame | null> {
  if (!RAWG_API_KEY) {
    console.warn('RAWG API key not configured')
    return null
  }

  // Check cache first
  if (useCache) {
    const cached = await getCachedGameDetails(gameId)
    if (cached) {
      console.log(`Cache hit for game details: ${gameId}`)
      return cached
    }
  }

  return rateLimiter.schedule(async () => {
    const url = new URL(`${RAWG_BASE_URL}/games/${gameId}`)
    url.searchParams.set('key', RAWG_API_KEY!)

    console.log(`RAWG API request: game details ${gameId}`)
    await incrementRAWGRequestCount() // Track API usage
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`RAWG API error: ${response.status}`)
    }

    const game = (await response.json()) as RAWGGame
    
    // Cache the results
    if (useCache) {
      await cacheGameDetails(gameId, game)
    }
    
    return game
  })
}

// Redis caching functions
import redisClient from './redis'
import { incrementRAWGRequestCount } from './api-monitor'

const CACHE_TTL_SEARCH = 60 * 60 * 24 * 7 // 7 days for search results
const CACHE_TTL_DETAILS = 60 * 60 * 24 * 30 // 30 days for game details

async function getCachedSearch(query: string): Promise<RAWGGame[] | null> {
  try {
    const key = `rawg:search:${query.toLowerCase()}`
    const cached = await redisClient.get(key)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error('Redis cache get error:', error)
    return null
  }
}

async function cacheSearch(query: string, results: RAWGGame[]): Promise<void> {
  try {
    const key = `rawg:search:${query.toLowerCase()}`
    await redisClient.setEx(key, CACHE_TTL_SEARCH, JSON.stringify(results))
  } catch (error) {
    console.error('Redis cache set error:', error)
  }
}

async function getCachedGameDetails(gameId: number): Promise<RAWGGame | null> {
  try {
    const key = `rawg:game:${gameId}`
    const cached = await redisClient.get(key)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error('Redis cache get error:', error)
    return null
  }
}

async function cacheGameDetails(gameId: number, game: RAWGGame): Promise<void> {
  try {
    const key = `rawg:game:${gameId}`
    await redisClient.setEx(key, CACHE_TTL_DETAILS, JSON.stringify(game))
  } catch (error) {
    console.error('Redis cache set error:', error)
  }
}

export type { RAWGGame, RAWGSearchResponse }
