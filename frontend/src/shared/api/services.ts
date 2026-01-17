import type { AxiosResponse } from "axios";
import { apiClient } from "./client";
import type {
  CredentialListResponse,
  CredentialSaveResponse,
  CredentialValidateResponse,
  PlatformListResponse,
  PlatformResponse,
  SaveCredentialRequest,
} from "./generated";

/**
 * Response from games search endpoint
 */
export interface SearchGamesResponse {
  games: GameSearchResult[];
}

/** Platform info from IGDB search */
export interface IgdbPlatformInfo {
  igdb_platform_id: number;
  name: string;
}

/** Store suggestion from IGDB websites */
export interface IgdbStoreInfo {
  slug: string;
  display_name: string;
}

/**
 * Game search result from IGDB
 */
export interface GameSearchResult {
  igdb_id: number;
  name: string;
  cover_art_url: string | null;
  release_date: string | null;
  platforms: IgdbPlatformInfo[];
  stores: IgdbStoreInfo[];
}

/**
 * Response from games list endpoint
 */
export interface GamesListResponse {
  games: Game[];
  total: number;
  page: number;
  per_page: number;
}

/**
 * User's game in library
 */
export interface Game {
  id: string;
  name: string;
  cover_art_url: string | null;
  platform_id: string | null;
  store_id: string | null;
  igdb_id: number | null;
  status: string | null;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Request to import a game from IGDB
 */
export interface ImportGameRequest {
  igdb_id: number;
  platform_id?: string;
  store_id?: string;
}

/**
 * Request to update a game
 */
export interface UpdateGameRequest {
  status?: string;
  rating?: number;
  notes?: string;
  platform_id?: string;
  store_id?: string;
}

/**
 * Response from stores list endpoint
 */
export interface StoresListResponse {
  stores: Store[];
}

/**
 * Store entity
 */
export interface Store {
  id: string;
  name: string;
  slug: string;
  display_name: string;
  platform_family: string | null;
  icon_url: string | null;
}

/**
 * Games API service with typed requests/responses.
 * Provides methods for searching, listing, and managing user's game library.
 */
export const GamesService = {
  /**
   * Search games using IGDB (server-side).
   *
   * @param params - Search parameters
   * @param params.query - Search query string
   * @returns Promise resolving to search results
   */
  async search(params: { query: string }): Promise<SearchGamesResponse> {
    const response: AxiosResponse<SearchGamesResponse> = await apiClient.get("/games/search", {
      params,
    });
    return response.data;
  },

  /**
   * List user's imported games with optional filters.
   *
   * @param params - Optional filter/pagination parameters
   * @returns Promise resolving to paginated games list
   */
  async list(params?: Record<string, unknown>): Promise<GamesListResponse> {
    const response: AxiosResponse<GamesListResponse> = await apiClient.get("/games", {
      params,
    });
    return response.data;
  },

  /**
   * Get single game by ID.
   *
   * @param id - Game unique identifier
   * @returns Promise resolving to game details
   */
  async getOne(id: string): Promise<Game> {
    const response: AxiosResponse<{ game: Game }> = await apiClient.get(`/games/${id}`);
    return response.data.game;
  },

  /**
   * Import game from IGDB into user's library.
   *
   * @param payload - Import request with IGDB ID and optional platform/store
   * @returns Promise resolving to created game
   */
  async create(payload: ImportGameRequest): Promise<Game> {
    const response: AxiosResponse<{ game: Game }> = await apiClient.post("/games", payload);
    return response.data.game;
  },

  /**
   * Update game status, rating, or other fields.
   *
   * @param id - Game unique identifier
   * @param payload - Fields to update
   * @returns Promise resolving to updated game
   */
  async update(id: string, payload: UpdateGameRequest): Promise<Game> {
    const response: AxiosResponse<{ game: Game }> = await apiClient.patch(`/games/${id}`, payload);
    return response.data.game;
  },

  /**
   * Delete game from user's library.
   *
   * @param id - Game unique identifier
   * @returns Promise resolving when deletion completes
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/games/${id}`);
  },
};

/**
 * Credentials API service for IGDB/Steam/RetroAchievements setup.
 * Provides methods for managing API credentials for external services.
 */
export const CredentialsService = {
  /**
   * Get list of configured credentials with status.
   *
   * @returns Promise resolving to credential status list
   */
  async list(): Promise<CredentialListResponse> {
    const response: AxiosResponse<CredentialListResponse> = await apiClient.get("/credentials");
    return response.data;
  },

  /**
   * Save new credentials (encrypted on server).
   *
   * @param payload - Credential save request with service type and credentials
   * @returns Promise resolving to save confirmation
   */
  async create(payload: SaveCredentialRequest): Promise<CredentialSaveResponse> {
    const response: AxiosResponse<CredentialSaveResponse> = await apiClient.post(
      "/credentials",
      payload
    );
    return response.data;
  },

  /**
   * Validate credentials by checking with external service.
   *
   * @param service - Service identifier to validate
   * @returns Promise resolving to validation result
   */
  async validate(service: string): Promise<CredentialValidateResponse> {
    const response: AxiosResponse<CredentialValidateResponse> = await apiClient.post(
      "/credentials/validate",
      { service }
    );
    return response.data;
  },

  /**
   * Delete/revoke credentials for a service.
   *
   * @param service - Service identifier to delete
   * @returns Promise resolving when deletion completes
   */
  async delete(service: string): Promise<void> {
    await apiClient.delete(`/credentials/${service}`);
  },
};

/**
 * Platforms API service.
 * Provides methods for listing and retrieving platform information.
 */
export const PlatformsService = {
  /**
   * List all available platforms (IGDB-driven).
   *
   * @returns Promise resolving to platforms list
   */
  async list(): Promise<PlatformListResponse> {
    const response: AxiosResponse<PlatformListResponse> = await apiClient.get("/platforms");
    return response.data;
  },

  /**
   * Get platform by ID.
   *
   * @param id - Platform unique identifier
   * @returns Promise resolving to platform details
   */
  async getOne(id: string): Promise<PlatformResponse> {
    const response: AxiosResponse<PlatformResponse> = await apiClient.get(`/platforms/${id}`);
    return response.data;
  },
};

/**
 * Stores API service.
 * Provides methods for listing available digital stores.
 */
export const StoresService = {
  /**
   * List all available stores.
   *
   * @returns Promise resolving to stores list
   */
  async list(): Promise<StoresListResponse> {
    const response: AxiosResponse<StoresListResponse> = await apiClient.get("/stores");
    return response.data;
  },
};
