import type { Game } from "../types";

export interface IGameRepository {
  /**
   * Find a game by ID.
   * @param id - Game ID (UUID)
   * @returns Game or null if not found
   */
  findById(id: string): Promise<Game | null>;

  /**
   * Find a game by IGDB ID.
   * @param igdb_id - IGDB game ID
   * @returns Game or null if not found
   */
  findByIgdbId(igdb_id: number): Promise<Game | null>;

  /**
   * Find a game by RAWG ID.
   * @param rawg_id - RAWG game ID
   * @returns Game or null if not found
   */
  findByRawgId(rawg_id: number): Promise<Game | null>;

  /**
   * Create a new game.
   * @param data - Game creation data
   * @returns Created game
   * @throws {ConflictError} If game with same IGDB/RAWG ID exists
   */
  create(data: {
    igdb_id?: number;
    rawg_id?: number;
    name: string;
    slug?: string;
    release_date?: Date;
    description?: string;
    cover_art_url?: string;
    background_image_url?: string;
    metacritic_score?: number;
    opencritic_score?: number;
    esrb_rating?: string;
    series_name?: string;
    expected_playtime?: number;
    metadata_source: "igdb" | "rawg" | "manual";
  }): Promise<Game>;

  /**
   * Update an existing game.
   * @param id - Game ID
   * @param data - Partial game data
   * @returns Updated game
   * @throws {NotFoundError} If game not found
   */
  update(id: string, data: Partial<Omit<Game, "id" | "created_at" | "updated_at">>): Promise<Game>;

  /**
   * Delete a game.
   * @param id - Game ID
   * @returns true if deleted, false if not found
   */
  delete(id: string): Promise<boolean>;

  /**
   * Search games by name (partial match).
   * @param query - Search query
   * @param limit - Max results (default 50)
   * @returns Array of matching games
   */
  search(query: string, limit?: number): Promise<Game[]>;

  /**
   * List all games with pagination.
   * @param skip - Number of records to skip
   * @param take - Number of records to return
   * @returns Array of games
   */
  list(skip?: number, take?: number): Promise<Game[]>;

  /**
   * Get total count of games.
   * @returns Total game count
   */
  count(): Promise<number>;
}
