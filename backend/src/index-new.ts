import 'reflect-metadata'
import { registerDependencies } from '@/container'
import { createHonoApp } from '@/infrastructure/http/app'

async function startServer(): Promise<void> {
  // Register DI dependencies
  registerDependencies()

  // Create Hono app
  const app = createHonoApp()

  // Start server
  const server = Bun.serve({
    port: process.env.PORT || 3000,
    fetch: app.fetch,
  })

  console.log(`Server running on http://localhost:${server.port}`)
}

startServer()
