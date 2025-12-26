import { createClient } from 'redis'

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

redisClient.on('error', (err) => console.error('Redis Client Error:', err))
redisClient.on('connect', () => console.log('Connected to Redis'))

// Only auto-connect if not explicitly disabled (for unit tests)
// Set SKIP_REDIS_CONNECT=1 when running unit tests
if (!process.env.SKIP_REDIS_CONNECT) {
  redisClient.connect().catch((err) => {
    console.error('Failed to connect to Redis:', err)
  })
}

export default redisClient
