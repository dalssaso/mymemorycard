import { createClient } from 'redis'
import { config } from '@/config'

const redisClient = createClient({
  url: config.redis.url,
})

redisClient.on('error', (err) => console.error('Redis Client Error:', err))
redisClient.on('connect', () => console.log('Connected to Redis'))

if (!config.skipRedisConnect) {
  redisClient.connect().catch((err) => {
    console.error('Failed to connect to Redis:', err)
  })
}

export default redisClient
