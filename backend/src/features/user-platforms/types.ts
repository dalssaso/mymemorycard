import type { InferSelectModel } from 'drizzle-orm'

import type { userPlatforms } from '@/db/schema'

/**
 * User-Platform association entity from database
 */
export type UserPlatform = InferSelectModel<typeof userPlatforms>

/**
 * Input for creating a new user-platform association
 */
export interface CreateUserPlatformInput {
  platformId: string
  username?: string
  iconUrl?: string
  profileUrl?: string
  notes?: string
}

/**
 * Input for updating a user-platform association
 */
export interface UpdateUserPlatformInput {
  username?: string
  iconUrl?: string
  profileUrl?: string
  notes?: string
}

/**
 * User-Platform response DTO (snake_case)
 */
export interface UserPlatformResponse {
  id: string
  user_id: string
  platform_id: string
  username?: string
  icon_url?: string
  profile_url?: string
  notes?: string
  created_at: string
}
