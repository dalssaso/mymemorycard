import redisClient from '@/services/redis'
import type { GameSummary } from './prompts'
import type { ModelsResponse } from './models'

const CACHE_TTL = 24 * 60 * 60
const CACHE_KEY_PREFIX = 'ai:library:'
const MODELS_CACHE_KEY_PREFIX = 'ai:models:'

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

export async function getCachedModels(provider: string): Promise<ModelsResponse | null> {
  try {
    const key = `${MODELS_CACHE_KEY_PREFIX}${provider}`
    const cached = await redisClient.get(key)
    if (!cached) {
      return null
    }
    const data = JSON.parse(cached) as ModelsResponse & { cachedAt: string }
    return {
      textModels: data.textModels,
      imageModels: data.imageModels,
    }
  } catch (error) {
    console.error('Error getting cached models:', error)
    return null
  }
}

export async function setCachedModels(
  provider: string,
  models: ModelsResponse
): Promise<void> {
  try {
    const key = `${MODELS_CACHE_KEY_PREFIX}${provider}`
    const dataWithTimestamp = {
      ...models,
      cachedAt: new Date().toISOString(),
    }
    await redisClient.setEx(key, CACHE_TTL, JSON.stringify(dataWithTimestamp))
  } catch (error) {
    console.error('Error setting cached models:', error)
  }
}
