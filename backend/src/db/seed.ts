import { db, schema } from './index'
import { sql } from 'drizzle-orm'

export async function seedPlatforms() {
  const defaultPlatforms = [
    { name: 'steam', displayName: 'Steam', platformType: 'pc' },
    { name: 'psn', displayName: 'PlayStation', platformType: 'console' },
    { name: 'xbox', displayName: 'Xbox', platformType: 'console' },
    { name: 'epic', displayName: 'Epic Games Store', platformType: 'pc' },
  ]

  for (const platform of defaultPlatforms) {
    await db
      .insert(schema.platforms)
      .values(platform)
      .onConflictDoNothing({ target: schema.platforms.name })
  }

  console.log('Platforms seeded successfully')
}
