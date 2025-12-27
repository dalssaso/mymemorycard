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

interface RAWGGameSeries {
  count: number
  results: Array<{
    id: number
    name: string
    slug: string
  }>
}

interface RAWGAchievement {
  id: number
  name: string
  description: string
  image: string
  percent: string
}

interface RAWGAddition {
  id: number
  name: string
  slug: string
  released: string | null
  background_image: string | null
}

export type AdditionType = 'dlc' | 'edition' | 'other'

export interface ClassifiedAddition extends RAWGAddition {
  addition_type: AdditionType
  is_complete_edition: boolean
}

const EDITION_PATTERNS = [
  /complete\s*edition/i,
  /game\s*of\s*the\s*year/i,
  /goty/i,
  /definitive\s*edition/i,
  /deluxe\s*edition/i,
  /ultimate\s*edition/i,
  /gold\s*edition/i,
  /bundle/i,
  /collection/i,
  /premium\s*edition/i,
  /enhanced\s*edition/i,
  /legendary\s*edition/i,
  /special\s*edition/i,
  /anniversary\s*edition/i,
]

const COMPLETE_EDITION_PATTERNS = [
  /complete\s*edition/i,
  /game\s*of\s*the\s*year/i,
  /goty/i,
  /definitive\s*edition/i,
  /ultimate\s*edition/i,
  /legendary\s*edition/i,
  /all\s*dlc/i,
]

const OTHER_PATTERNS = [
  /soundtrack/i,
  /ost/i,
  /theme/i,
  /avatar/i,
  /artbook/i,
  /art\s*book/i,
  /wallpaper/i,
  /digital\s*art/i,
  /making\s*of/i,
  /behind\s*the\s*scenes/i,
]

export function classifyAddition(name: string): { type: AdditionType; isComplete: boolean } {
  const lowerName = name.toLowerCase()

  for (const pattern of OTHER_PATTERNS) {
    if (pattern.test(lowerName)) {
      return { type: 'other', isComplete: false }
    }
  }

  for (const pattern of EDITION_PATTERNS) {
    if (pattern.test(lowerName)) {
      const isComplete = COMPLETE_EDITION_PATTERNS.some((p) => p.test(lowerName))
      return { type: 'edition', isComplete }
    }
  }

  return { type: 'dlc', isComplete: false }
}

interface RAWGAdditionsResponse {
  count: number
  next: string | null
  previous: string | null
  results: RAWGAddition[]
}

interface RAWGAchievementsResponse {
  count: number
  next: string | null
  previous: string | null
  results: RAWGAchievement[]
}

interface RAWGSearchResponse {
  count: number
  results: RAWGGame[]
}

import { config } from '@/config'

const RAWG_API_KEY = config.rawg.apiKey
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

export async function getGameAchievements(gameId: number, useCache = true): Promise<RAWGAchievement[]> {
  if (!RAWG_API_KEY) {
    console.warn('RAWG API key not configured')
    return []
  }

  if (useCache) {
    const cached = await getCachedAchievements(gameId)
    if (cached) {
      console.log(`Cache hit for achievements: ${gameId}`)
      return cached
    }
  }

  return rateLimiter.schedule(async () => {
    const allAchievements: RAWGAchievement[] = []
    let nextUrl: string | null = `${RAWG_BASE_URL}/games/${gameId}/achievements?key=${RAWG_API_KEY}&page_size=40`

    while (nextUrl) {
      console.log(`RAWG API request: achievements for game ${gameId}`)
      await incrementRAWGRequestCount()
      const response = await fetch(nextUrl)

      if (!response.ok) {
        if (response.status === 404) {
          await cacheAchievements(gameId, [])
          return []
        }
        throw new Error(`RAWG API error: ${response.status}`)
      }

      const data = (await response.json()) as RAWGAchievementsResponse
      allAchievements.push(...data.results)

      if (data.next && allAchievements.length < 200) {
        nextUrl = data.next
      } else {
        nextUrl = null
      }
    }

    if (useCache) {
      await cacheAchievements(gameId, allAchievements)
    }

    return allAchievements
  })
}

export async function getGameSeries(gameId: number, useCache = true): Promise<string | null> {
  if (!RAWG_API_KEY) {
    console.warn('RAWG API key not configured')
    return null
  }

  // Check cache first
  if (useCache) {
    const cached = await getCachedGameSeries(gameId)
    if (cached !== undefined) {
      console.log(`Cache hit for game series: ${gameId}`)
      return cached
    }
  }

  return rateLimiter.schedule(async () => {
    const url = new URL(`${RAWG_BASE_URL}/games/${gameId}/game-series`)
    url.searchParams.set('key', RAWG_API_KEY!)

    console.log(`RAWG API request: game series ${gameId}`)
    await incrementRAWGRequestCount() // Track API usage
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      if (response.status === 404) {
        await cacheGameSeries(gameId, null)
        return null
      }
      throw new Error(`RAWG API error: ${response.status}`)
    }

    const data = (await response.json()) as RAWGGameSeries
    
    // If game is part of a series, extract the series name
    // Usually the series name is a common prefix in the game names
    let seriesName: string | null = null
    if (data.count > 1 && data.results.length > 0) {
      // Use the most common words in the game names as series name
      const firstGame = data.results[0].name
      const words = firstGame.split(/[\s:-]+/)
      
      // Try to find common prefix (series name is usually 1-3 words)
      for (let i = Math.min(3, words.length); i >= 1; i--) {
        const potentialSeries = words.slice(0, i).join(' ')
        const matchCount = data.results.filter(g => 
          g.name.toLowerCase().startsWith(potentialSeries.toLowerCase())
        ).length
        
        if (matchCount >= Math.min(3, data.count)) {
          seriesName = potentialSeries
          break
        }
      }
    }
    
    // Cache the results
    if (useCache) {
      await cacheGameSeries(gameId, seriesName)
    }
    
    return seriesName
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

async function getCachedGameSeries(gameId: number): Promise<string | null | undefined> {
  try {
    const key = `rawg:series:${gameId}`
    const cached = await redisClient.get(key)
    if (cached === 'null') return null
    return cached ? cached : undefined
  } catch (error) {
    console.error('Redis cache get error:', error)
    return undefined
  }
}

async function cacheGameSeries(gameId: number, seriesName: string | null): Promise<void> {
  try {
    const key = `rawg:series:${gameId}`
    await redisClient.setEx(key, CACHE_TTL_DETAILS, seriesName || 'null')
  } catch (error) {
    console.error('Redis cache set error:', error)
  }
}

async function getCachedAchievements(gameId: number): Promise<RAWGAchievement[] | null> {
  try {
    const key = `rawg:achievements:${gameId}`
    const cached = await redisClient.get(key)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error('Redis cache get error:', error)
    return null
  }
}

async function cacheAchievements(gameId: number, achievements: RAWGAchievement[]): Promise<void> {
  try {
    const key = `rawg:achievements:${gameId}`
    await redisClient.setEx(key, CACHE_TTL_DETAILS, JSON.stringify(achievements))
  } catch (error) {
    console.error('Redis cache set error:', error)
  }
}

export async function getGameAdditions(gameId: number, useCache = true): Promise<RAWGAddition[]> {
  if (!RAWG_API_KEY) {
    console.warn('RAWG API key not configured')
    return []
  }

  if (useCache) {
    const cached = await getCachedAdditions(gameId)
    if (cached) {
      console.log(`Cache hit for additions: ${gameId}`)
      return cached
    }
  }

  return rateLimiter.schedule(async () => {
    const allAdditions: RAWGAddition[] = []
    let nextUrl: string | null = `${RAWG_BASE_URL}/games/${gameId}/additions?key=${RAWG_API_KEY}&page_size=40`

    while (nextUrl) {
      console.log(`RAWG API request: additions for game ${gameId}`)
      await incrementRAWGRequestCount()
      const response = await fetch(nextUrl)

      if (!response.ok) {
        if (response.status === 404) {
          await cacheAdditions(gameId, [])
          return []
        }
        throw new Error(`RAWG API error: ${response.status}`)
      }

      const data = (await response.json()) as RAWGAdditionsResponse
      allAdditions.push(...data.results)

      if (data.next && allAdditions.length < 100) {
        nextUrl = data.next
      } else {
        nextUrl = null
      }
    }

    if (useCache) {
      await cacheAdditions(gameId, allAdditions)
    }

    return allAdditions
  })
}

async function getCachedAdditions(gameId: number): Promise<RAWGAddition[] | null> {
  try {
    const key = `rawg:additions:${gameId}`
    const cached = await redisClient.get(key)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error('Redis cache get error:', error)
    return null
  }
}

async function cacheAdditions(gameId: number, additions: RAWGAddition[]): Promise<void> {
  try {
    const key = `rawg:additions:${gameId}`
    await redisClient.setEx(key, CACHE_TTL_DETAILS, JSON.stringify(additions))
  } catch (error) {
    console.error('Redis cache set error:', error)
  }
}

export type { RAWGGame, RAWGSearchResponse, RAWGGameSeries, RAWGAchievement, RAWGAddition }
