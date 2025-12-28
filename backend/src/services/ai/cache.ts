import redisClient from '@/services/redis'
import type { GameSummary } from './prompts'

const CACHE_TTL = 24 * 60 * 60
const CACHE_KEY_PREFIX = 'ai:library:'

export async function getCachedLibrary(userId: string): Promise<GameSummary[] | null> {
  try {
    const key = `${CACHE_KEY_PREFIX}${userId}`
    const cached = await redisClient.get(key)
    if (!cached) {
      return null
    }
    return JSON.parse(cached) as GameSummary[]
  } catch (error) {
    console.error('Error getting cached library:', error)
    return null
  }
}

export async function setCachedLibrary(userId: string, library: GameSummary[]): Promise<void> {
  try {
    const key = `${CACHE_KEY_PREFIX}${userId}`
    await redisClient.setEx(key, CACHE_TTL, JSON.stringify(library))
  } catch (error) {
    console.error('Error setting cached library:', error)
  }
}

export async function invalidateCachedLibrary(userId: string): Promise<void> {
  try {
    const key = `${CACHE_KEY_PREFIX}${userId}`
    await redisClient.del(key)
  } catch (error) {
    console.error('Error invalidating cached library:', error)
  }
}
