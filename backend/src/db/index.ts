import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from './schema'
import { config } from '@/config'

const connectionString = config.database.url

const migrationClient = postgres(connectionString, { max: 1 })

const queryClient = postgres(connectionString)

export const db = drizzle(queryClient, { schema })

export async function runMigrations() {
  console.log('Running database migrations...')
  const migrationDb = drizzle(migrationClient)
  await migrate(migrationDb, { migrationsFolder: './drizzle' })
  console.log('Migrations completed successfully')

  const { seedPlatforms } = await import('./seed')
  await seedPlatforms()
}

export async function closeMigrationConnection() {
  await migrationClient.end()
}

export { schema }
