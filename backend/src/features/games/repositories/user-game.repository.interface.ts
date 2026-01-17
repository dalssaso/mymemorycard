import type { UserGame } from "../types";

export interface IUserGameRepository {
  /**
   * Find a user game entry by ID.
   * @param id - User game ID
   * @returns User game or null
   */
  findById(id: string): Promise<UserGame | null>;

  /**
   * Find a user game by user, game, and platform.
   * @param userId - User ID
   * @param gameId - Game ID
   * @param platformId - Platform ID
   * @returns User game or null
   */
  findByUserGamePlatform(
    userId: string,
    gameId: string,
    platformId: string
  ): Promise<UserGame | null>;

  /**
   * Create a user game entry.
   * @param data - Entry data
   * @returns Created user game
   * @throws {ConflictError} If entry already exists
   */
  create(data: {
    userId: string;
    gameId: string;
    platformId: string;
    storeId?: string;
    platformGameId?: string;
    owned?: boolean;
    purchasedDate?: Date;
    importSource?: string;
  }): Promise<UserGame>;

  /**
   * Update a user game entry.
   * @param id - User game ID
   * @param userId - User ID (for auth check)
   * @param data - Partial data
   * @returns Updated user game
   * @throws {NotFoundError} If not found or access denied
   */
  update(
    id: string,
    userId: string,
    data: Partial<Omit<UserGame, "id" | "user_id" | "created_at">>
  ): Promise<UserGame>;

  /**
   * Delete a user game entry.
   * @param id - User game ID
   * @param userId - User ID (for auth check)
   * @returns true if deleted
   * @throws {NotFoundError} If not found or access denied
   */
  delete(id: string, userId: string): Promise<boolean>;

  /**
   * List user game entries for a user.
   * @param userId - User ID
   * @param skip - Pagination offset
   * @param take - Pagination limit
   * @returns Array of user games
   */
  listByUser(userId: string, skip?: number, take?: number): Promise<UserGame[]>;

  /**
   * Get user game entries for a specific game.
   * @param userId - User ID
   * @param gameId - Game ID
   * @returns Array (user may own on multiple platforms)
   */
  getByGameForUser(userId: string, gameId: string): Promise<UserGame[]>;

  /**
   * Delete all user game entries for a user (used in cleanup).
   * @param userId - User ID
   * @returns Count of deleted records
   */
  deleteAllByUser(userId: string): Promise<number>;

  /**
   * Count user games for a user.
   * @param userId - User ID
   * @returns Total count
   */
  countByUser(userId: string): Promise<number>;
}
