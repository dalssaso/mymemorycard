import type { GameStatus } from "../dtos/user-game-progress.dto"

/**
 * User game progress record from database
 */
export interface UserGameProgress {
  user_id: string
  game_id: string
  platform_id: string
  status: GameStatus | null
  user_rating: number | null
  notes: string | null
  is_favorite: boolean
  started_at: Date | null
  completed_at: Date | null
}

/**
 * User game custom fields record from database
 */
export interface UserGameCustomFields {
  user_id: string
  game_id: string
  platform_id: string
  completion_percentage: number | null
  difficulty_rating: number | null
  updated_at: Date | null
}

/**
 * Repository interface for user game progress operations
 */
export interface IUserGameProgressRepository {
  /**
   * Find progress record for a specific game and platform
   * @param userId - User ID
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @returns Progress record or null if not found
   */
  findByGameAndPlatform(
    userId: string,
    gameId: string,
    platformId: string
  ): Promise<UserGameProgress | null>

  /**
   * Update the status for a game on a specific platform
   * @param userId - User ID
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @param status - New status
   */
  updateStatus(
    userId: string,
    gameId: string,
    platformId: string,
    status: GameStatus
  ): Promise<void>

  /**
   * Update the user rating for a game on a specific platform
   * @param userId - User ID
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @param rating - New rating (1-10)
   */
  updateRating(
    userId: string,
    gameId: string,
    platformId: string,
    rating: number
  ): Promise<void>

  /**
   * Update notes for a game on a specific platform
   * @param userId - User ID
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @param notes - New notes
   */
  updateNotes(
    userId: string,
    gameId: string,
    platformId: string,
    notes: string
  ): Promise<void>

  /**
   * Update favorite status for a game on a specific platform
   * @param userId - User ID
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @param isFavorite - New favorite status
   */
  updateFavorite(
    userId: string,
    gameId: string,
    platformId: string,
    isFavorite: boolean
  ): Promise<void>

  /**
   * Get custom fields for a game on a specific platform
   * @param userId - User ID
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @returns Custom fields or null if not found
   */
  getCustomFields(
    userId: string,
    gameId: string,
    platformId: string
  ): Promise<UserGameCustomFields | null>

  /**
   * Update custom fields for a game on a specific platform
   * @param userId - User ID
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @param fields - Fields to update
   */
  updateCustomFields(
    userId: string,
    gameId: string,
    platformId: string,
    fields: { completion_percentage?: number; difficulty_rating?: number }
  ): Promise<void>
}
