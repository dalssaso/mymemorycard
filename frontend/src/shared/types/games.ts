/**
 * Frontend game type aligned to new IGDB-driven backend schema.
 * All fields use snake_case to match backend API responses.
 */
export interface Game {
  id: string
  igdb_id: number
  name: string
  description?: string
  cover_art_url?: string | null
  platform_id: string
  store_id: string
  metadata_source: 'igdb'
  status: GameStatus
  rating?: number
  hours_played?: number
  is_favorite: boolean
  completion_percentage?: number
  created_at: string
  updated_at?: string
}

/**
 * Game status representing the player's progress with a game.
 */
export type GameStatus = 'backlog' | 'playing' | 'finished' | 'completed' | 'dropped'

/**
 * Search result from IGDB API.
 */
export interface GameSearchResult {
  igdb_id: number
  name: string
  cover_url?: string
  platforms: Array<{
    igdb_platform_id: number
    name: string
  }>
  franchise?: string
  stores: Array<{
    slug: string
    display_name: string
  }>
}

/**
 * Payload for importing a game.
 */
export interface GameImportPayload {
  igdb_id: number
  platform_id: string
  store_id: string
  metadata_source: 'igdb'
}

/**
 * Platform type aligned to IGDB schema.
 */
export interface Platform {
  id: string
  igdb_platform_id: number
  name: string
  abbreviation?: string
  slug?: string
  platform_family?: string
  color_primary?: string
}

/**
 * Store type (digital/physical).
 */
export interface Store {
  id: string
  name: string
  display_name: string
  store_type: 'digital' | 'physical'
  platform_family?: string
  color_primary?: string
  icon_url?: string
  supports_achievements?: boolean
  supports_library_sync?: boolean
}

/**
 * Credential status response.
 */
export interface CredentialStatus {
  service: 'igdb' | 'steam' | 'retroachievements' | 'rawg'
  is_active: boolean
  has_valid_token: boolean
  token_expires_at?: string
  last_validated_at?: string
}

/**
 * Credential service type.
 */
export type CredentialService = CredentialStatus['service']
