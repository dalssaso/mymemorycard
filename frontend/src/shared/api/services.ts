import axios from "axios";

import {
  deleteApiV1CredentialsByService,
  deleteApiV1UserGamesById,
  getApiV1Credentials,
  getApiV1Platforms,
  getApiV1PlatformsById,
  getApiV1Stores,
  getApiV1StoresById,
  getApiV1UserGames,
  getApiV1UserGamesById,
  patchApiV1UserGamesById,
  postApiV1Credentials,
  postApiV1CredentialsValidate,
  postApiV1GamesByIdImport,
  postApiV1GamesSearch,
} from "./generated";
import type {
  CredentialListResponse,
  CredentialSaveResponse,
  CredentialValidateResponse,
  ErrorResponse,
  PlatformListResponse,
  PlatformResponse,
  SaveCredentialRequest,
  UserGameUpdateRequest,
} from "./generated";
import type {
  CredentialService,
  GameSearchResult,
  IgdbPlatformInfo,
  IgdbStoreInfo,
} from "@/shared/types";
import { adaptSearchResponse, adaptUserGame, adaptUserGamesListResponse } from "./adapters/games";
import { adaptStore, adaptStoreListResponse } from "./adapters/stores";

// Re-export canonical types for backwards compatibility
export type { GameSearchResult, IgdbPlatformInfo, IgdbStoreInfo };

/**
 * Normalized API error with consistent structure.
 */
export interface NormalizedApiError extends Error {
  status: number | null;
  code: string | null;
  details: Record<string, unknown> | null;
  requestId: string | null;
}

/**
 * Normalizes API errors from Axios or SDK calls into a consistent format.
 * Extracts error message, status code, and additional details from the response.
 *
 * @param error - The error to normalize
 * @returns Normalized error with consistent structure
 */
export function normalizeApiError(error: unknown): NormalizedApiError {
  let message = "An unexpected error occurred";
  let status: number | null = null;
  let code: string | null = null;
  let details: Record<string, unknown> | null = null;
  let requestId: string | null = null;

  if (axios.isAxiosError(error)) {
    status = error.response?.status ?? null;
    const data = error.response?.data as ErrorResponse | undefined;
    if (data) {
      message = data.error || error.message;
      code = data.code ?? null;
      details = data.details ?? null;
      requestId = data.request_id ?? null;
    } else {
      message = error.message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  const normalizedError = new Error(message) as NormalizedApiError;
  normalizedError.name = "ApiError";
  normalizedError.status = status;
  normalizedError.code = code;
  normalizedError.details = details;
  normalizedError.requestId = requestId;

  return normalizedError;
}

/**
 * Response from games search endpoint
 */
export interface SearchGamesResponse {
  games: GameSearchResult[];
}

/**
 * Response from games list endpoint
 */
export interface GamesListResponse {
  games: Game[];
  total: number;
  page: number;
  per_page: number;
  has_pagination: boolean;
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
  updated_at: string | null;
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
 * Request to update a game (frontend-facing interface).
 * Note: Currently the backend only supports owned and purchased_date fields.
 */
export interface UpdateGameRequest {
  status?: string;
  rating?: number;
  notes?: string;
  platform_id?: string;
  store_id?: string;
  owned?: boolean;
  purchased_date?: string;
}

/**
 * Query parameters for listing games.
 */
export type GamesListQueryParams = Record<string, string | number | boolean | undefined>;

/**
 * Maps frontend UpdateGameRequest to SDK UserGameUpdateRequest.
 * Only includes fields supported by the backend API.
 *
 * @param request - Frontend update request
 * @returns SDK-compatible update request
 */
function mapUpdateGameRequest(request: UpdateGameRequest): UserGameUpdateRequest {
  const mapped: UserGameUpdateRequest = {};
  if (request.owned !== undefined) {
    mapped.owned = request.owned;
  }
  if (request.purchased_date !== undefined) {
    mapped.purchased_date = request.purchased_date;
  }
  return mapped;
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
   * @throws {NormalizedApiError} When the API request fails
   */
  async search(params: { query: string; signal?: AbortSignal }): Promise<SearchGamesResponse> {
    try {
      const response = await postApiV1GamesSearch({
        body: { query: params.query },
        signal: params.signal,
        throwOnError: true,
      });
      return adaptSearchResponse(response.data);
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * List user's imported games with optional filters.
   *
   * @param params - Optional filter/pagination parameters
   * @returns Promise resolving to paginated games list
   * @throws {NormalizedApiError} When the API request fails
   */
  async list(params?: GamesListQueryParams): Promise<GamesListResponse> {
    try {
      const response = await getApiV1UserGames({
        query: params,
        throwOnError: true,
      });
      return adaptUserGamesListResponse(response.data);
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Get single game by ID.
   *
   * @param id - Game unique identifier
   * @returns Promise resolving to game details
   * @throws {NormalizedApiError} When the API request fails
   */
  async getOne(id: string): Promise<Game> {
    try {
      const response = await getApiV1UserGamesById({
        path: { id },
        throwOnError: true,
      });
      return adaptUserGame(response.data);
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Import game from IGDB into user's library.
   *
   * @param payload - Import request with IGDB ID and platform/store
   * @returns Promise resolving to created game
   * @throws {NormalizedApiError} When the API request fails or validation fails
   */
  async create(payload: ImportGameRequest): Promise<Game> {
    if (!payload.platform_id) {
      const validationError = new Error("platform_id is required for game import");
      const normalized = normalizeApiError(validationError);
      normalized.status = 400;
      normalized.code = "VALIDATION_ERROR";
      throw normalized;
    }
    try {
      const response = await postApiV1GamesByIdImport({
        body: {
          igdb_id: payload.igdb_id,
          platform_id: payload.platform_id,
          store_id: payload.store_id,
        },
        throwOnError: true,
      });
      return adaptUserGame(response.data);
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Update game status, rating, or other fields.
   *
   * @param id - Game unique identifier
   * @param payload - Fields to update
   * @returns Promise resolving to updated game
   * @throws {NormalizedApiError} When the API request fails
   */
  async update(id: string, payload: UpdateGameRequest): Promise<Game> {
    try {
      const response = await patchApiV1UserGamesById({
        path: { id },
        body: mapUpdateGameRequest(payload),
        throwOnError: true,
      });
      return adaptUserGame(response.data);
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Delete game from user's library.
   *
   * @param id - Game unique identifier
   * @returns Promise resolving when deletion completes
   * @throws {NormalizedApiError} When the API request fails
   */
  async delete(id: string): Promise<void> {
    try {
      await deleteApiV1UserGamesById({
        path: { id },
        throwOnError: true,
      });
    } catch (error) {
      throw normalizeApiError(error);
    }
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
   * @throws {NormalizedApiError} When the API request fails
   */
  async list(): Promise<CredentialListResponse> {
    try {
      const response = await getApiV1Credentials({ throwOnError: true });
      return response.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Save new credentials (encrypted on server).
   *
   * @param payload - Credential save request with service type and credentials
   * @returns Promise resolving to save confirmation
   * @throws {NormalizedApiError} When the API request fails
   */
  async create(payload: SaveCredentialRequest): Promise<CredentialSaveResponse> {
    try {
      const response = await postApiV1Credentials({ body: payload, throwOnError: true });
      return response.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Validate credentials by checking with external service.
   *
   * @param service - Service identifier to validate
   * @returns Promise resolving to validation result
   * @throws {NormalizedApiError} When the API request fails
   */
  async validate(service: CredentialService): Promise<CredentialValidateResponse> {
    try {
      const response = await postApiV1CredentialsValidate({
        body: { service },
        throwOnError: true,
      });
      return response.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Delete/revoke credentials for a service.
   *
   * @param service - Service identifier to delete
   * @returns Promise resolving when deletion completes
   * @throws {NormalizedApiError} When the API request fails
   */
  async delete(service: CredentialService): Promise<void> {
    try {
      await deleteApiV1CredentialsByService({
        path: { service },
        throwOnError: true,
      });
    } catch (error) {
      throw normalizeApiError(error);
    }
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
   * @throws {NormalizedApiError} When the API request fails
   */
  async list(): Promise<PlatformListResponse> {
    try {
      const response = await getApiV1Platforms({ throwOnError: true });
      return response.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Get platform by ID.
   *
   * @param id - Platform unique identifier
   * @returns Promise resolving to platform details
   * @throws {NormalizedApiError} When the API request fails
   */
  async getOne(id: string): Promise<PlatformResponse> {
    try {
      const response = await getApiV1PlatformsById({ path: { id }, throwOnError: true });
      return response.data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};

/**
 * Stores API service.
 * Provides methods for listing and retrieving store information.
 */
export const StoresService = {
  /**
   * List all available stores.
   *
   * @returns Promise resolving to stores list
   * @throws {NormalizedApiError} When the API request fails
   */
  async list(): Promise<StoresListResponse> {
    try {
      const response = await getApiV1Stores({ throwOnError: true });
      return adaptStoreListResponse(response.data);
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  /**
   * Get store by ID.
   *
   * @param id - Store unique identifier
   * @returns Promise resolving to store details
   * @throws {NormalizedApiError} When the API request fails
   */
  async getOne(id: string): Promise<Store> {
    try {
      const response = await getApiV1StoresById({ path: { id }, throwOnError: true });
      return adaptStore(response.data.store);
    } catch (error) {
      throw normalizeApiError(error);
    }
  },
};
