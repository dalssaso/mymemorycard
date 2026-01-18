import { injectable, inject } from "tsyringe";
import { eq, ilike, sql } from "drizzle-orm";
import { DATABASE_TOKEN } from "@/container/tokens";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import { games } from "@/db/schema";
import { ConflictError, NotFoundError } from "@/shared/errors/base";
import type { IGameRepository } from "./game.repository.interface";
import type { Game } from "../types";

@injectable()
export class GameRepository implements IGameRepository {
  constructor(@inject(DATABASE_TOKEN) private db: DrizzleDB) {}

  /**
   * Find a game by ID.
   * @param id - Game ID (UUID)
   * @returns Game or null if not found
   */
  async findById(id: string): Promise<Game | null> {
    const result = await this.db.query.games.findFirst({
      where: eq(games.id, id),
    });
    return result ? this.mapToGame(result) : null;
  }

  /**
   * Find a game by IGDB ID.
   * @param igdb_id - IGDB game ID
   * @returns Game or null if not found
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async findByIgdbId(igdb_id: number): Promise<Game | null> {
    const result = await this.db.query.games.findFirst({
      where: eq(games.igdbId, igdb_id),
    });
    return result ? this.mapToGame(result) : null;
  }

  /**
   * Find a game by RAWG ID.
   * @param rawg_id - RAWG game ID
   * @returns Game or null if not found
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async findByRawgId(rawg_id: number): Promise<Game | null> {
    const result = await this.db.query.games.findFirst({
      where: eq(games.rawgId, rawg_id),
    });
    return result ? this.mapToGame(result) : null;
  }

  /**
   * Find a game by Steam App ID.
   * @param steamAppId - Steam application ID
   * @returns Game or null if not found
   */
  async findBySteamAppId(steamAppId: number): Promise<Game | null> {
    const result = await this.db.query.games.findFirst({
      where: eq(games.steamAppId, steamAppId),
    });
    return result ? this.mapToGame(result) : null;
  }

  /**
   * Find a game by RetroAchievements game ID.
   * @param retroGameId - RetroAchievements game ID
   * @returns Game or null if not found
   */
  async findByRetroGameId(retroGameId: number): Promise<Game | null> {
    const result = await this.db.query.games.findFirst({
      where: eq(games.retroGameId, retroGameId),
    });
    return result ? this.mapToGame(result) : null;
  }

  /**
   * Create a new game.
   * @param data - Game creation data
   * @returns Created game
   * @throws {ConflictError} If game with same IGDB/RAWG ID exists
   */
  async create(data: {
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
  }): Promise<Game> {
    try {
      const result = await this.db
        .insert(games)
        .values({
          igdbId: data.igdb_id,
          rawgId: data.rawg_id,
          name: data.name,
          slug: data.slug,
          releaseDate: data.release_date ? this.formatDateForDb(data.release_date) : null,
          description: data.description,
          coverArtUrl: data.cover_art_url,
          backgroundImageUrl: data.background_image_url,
          metacriticScore: data.metacritic_score,
          opencriticScore: data.opencritic_score,
          esrbRating: data.esrb_rating,
          seriesName: data.series_name,
          expectedPlaytime: data.expected_playtime,
          metadataSource: data.metadata_source,
        })
        .returning();

      return this.mapToGame(result[0]);
    } catch (error) {
      const err = error as Record<string, unknown> & {
        cause?: Record<string, unknown>;
      };
      const isUniqueViolation =
        err.code === "23505" ||
        (err.cause && (err.cause as Record<string, unknown>).code === "23505") ||
        (typeof err.message === "string" && err.message.includes("23505"));
      if (isUniqueViolation) {
        throw new ConflictError(`Game with IGDB ID ${data.igdb_id || data.rawg_id} already exists`);
      }
      throw error;
    }
  }

  /**
   * Update an existing game.
   * @param id - Game ID
   * @param data - Partial game data
   * @returns Updated game
   * @throws {NotFoundError} If game not found
   * @throws {ConflictError} If unique constraint violation
   */
  async update(
    id: string,
    data: Partial<Omit<Game, "id" | "created_at" | "updated_at">>
  ): Promise<Game> {
    try {
      const result = await this.db
        .update(games)
        .set({
          ...(data.igdb_id !== undefined && { igdbId: data.igdb_id }),
          ...(data.rawg_id !== undefined && { rawgId: data.rawg_id }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.release_date !== undefined && {
            releaseDate: data.release_date ? this.formatDateForDb(data.release_date) : null,
          }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.cover_art_url !== undefined && {
            coverArtUrl: data.cover_art_url,
          }),
          ...(data.background_image_url !== undefined && {
            backgroundImageUrl: data.background_image_url,
          }),
          ...(data.metacritic_score !== undefined && {
            metacriticScore: data.metacritic_score,
          }),
          ...(data.opencritic_score !== undefined && {
            opencriticScore: data.opencritic_score,
          }),
          ...(data.esrb_rating !== undefined && {
            esrbRating: data.esrb_rating,
          }),
          ...(data.series_name !== undefined && {
            seriesName: data.series_name,
          }),
          ...(data.expected_playtime !== undefined && {
            expectedPlaytime: data.expected_playtime,
          }),
          ...(data.metadata_source !== undefined && {
            metadataSource: data.metadata_source,
          }),
        })
        .where(eq(games.id, id))
        .returning();

      if (result.length === 0) {
        throw new NotFoundError("Game", id);
      }

      return this.mapToGame(result[0]);
    } catch (error) {
      const err = error as { code?: string; cause?: { code?: string } };
      const isUniqueViolation = err.code === "23505" || err.cause?.code === "23505";
      if (isUniqueViolation) {
        throw new ConflictError(`Game with this IGDB ID already exists`);
      }
      throw error;
    }
  }

  /**
   * Delete a game.
   * @param id - Game ID
   * @returns true if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(games).where(eq(games.id, id)).returning();

    return result.length > 0;
  }

  /**
   * Search games by name (partial match).
   * @param query - Search query
   * @param limit - Max results (default 50)
   * @returns Array of matching games
   */
  async search(query: string, limit = 50): Promise<Game[]> {
    const results = await this.db.query.games.findMany({
      where: ilike(games.name, `%${query}%`),
      limit,
    });
    return results.map((row) => this.mapToGame(row));
  }

  /**
   * List all games with pagination.
   * @param skip - Number of records to skip
   * @param take - Number of records to return
   * @returns Array of games
   */
  async list(skip = 0, take = 50): Promise<Game[]> {
    const results = await this.db.query.games.findMany({
      offset: skip,
      limit: take,
    });
    return results.map((row) => this.mapToGame(row));
  }

  /**
   * Get total count of games.
   * @returns Total game count
   */
  async count(): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(games);

    return result[0]?.count ?? 0;
  }

  private mapToGame(row: Record<string, unknown>): Game {
    return {
      id: row.id as string,
      igdb_id: (row.igdbId as number) || null,
      rawg_id: (row.rawgId as number) || null,
      steam_app_id: (row.steamAppId as number) || null,
      retro_game_id: (row.retroGameId as number) || null,
      name: row.name as string,
      slug: (row.slug as string) || null,
      release_date: this.ensureDate(row.releaseDate),
      description: (row.description as string) || null,
      cover_art_url: (row.coverArtUrl as string) || null,
      background_image_url: (row.backgroundImageUrl as string) || null,
      metacritic_score: (row.metacriticScore as number) || null,
      opencritic_score: (row.opencriticScore as number) || null,
      esrb_rating: (row.esrbRating as string) || null,
      series_name: (row.seriesName as string) || null,
      expected_playtime: (row.expectedPlaytime as number) || null,
      metadata_source: row.metadataSource as "igdb" | "rawg" | "manual",
      created_at: this.ensureDate(row.createdAt) as Date,
      updated_at: this.ensureDate(row.updatedAt) as Date,
    };
  }

  private ensureDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string") return new Date(`${value}T00:00:00Z`);
    return null;
  }

  private formatDateForDb(date: Date): string {
    return date.toISOString().split("T")[0];
  }
}
