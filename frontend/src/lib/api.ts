import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data: { username: string; password: string }) => api.post("/auth/register", data),
  login: (data: { username: string; password: string }) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// Games API
export const gamesAPI = {
  getAll: (params?: {
    platform?: string;
    status?: string;
    favorites?: boolean;
    genre?: string;
    collection?: string;
    franchise?: string;
    sort?: string;
  }) => {
    if (!params) return api.get("/games");
    const searchParams = new URLSearchParams();
    if (params.platform) searchParams.set("platform", params.platform);
    if (params.status) searchParams.set("status", params.status);
    if (params.favorites) searchParams.set("favorites", "true");
    if (params.genre) searchParams.set("genre", params.genre);
    if (params.collection) searchParams.set("collection", params.collection);
    if (params.franchise) searchParams.set("franchise", params.franchise);
    if (params.sort) searchParams.set("sort", params.sort);
    return api.get(`/games?${searchParams.toString()}`);
  },
  getGenreStats: () => api.get("/games/stats/genres"),
  export: (format: "json" | "csv") =>
    api.get(`/games/export?format=${format}`, { responseType: "blob" }),
  getOne: (id: string) => api.get(`/games/${id}`),
  delete: (id: string, platformId: string) =>
    api.delete(`/games/${id}`, { params: { platform_id: platformId } }),
  bulkDelete: (gameIds: string[]) => api.post("/games/bulk-delete", { gameIds }),
  updateStatus: (id: string, platformId: string, status: string) =>
    api.patch(`/games/${id}/status`, { platform_id: platformId, status }),
  updateRating: (id: string, platformId: string, rating: number) =>
    api.put(`/games/${id}/rating`, { platform_id: platformId, rating }),
  updateNotes: (id: string, platformId: string, notes: string) =>
    api.post(`/games/${id}/notes`, { platform_id: platformId, notes }),
  toggleFavorite: (id: string, platformId: string, isFavorite: boolean) =>
    api.put(`/games/${id}/favorite`, { platform_id: platformId, is_favorite: isFavorite }),
  getCustomFields: (id: string, platformId: string) =>
    api.get(`/games/${id}/custom-fields`, { params: { platform_id: platformId } }),
  updateCustomFields: (
    id: string,
    platformId: string,
    fields: {
      estimated_completion_hours?: number | null;
      actual_playtime_hours?: number | null;
      completion_percentage?: number | null;
      difficulty_rating?: number | null;
      achievements_total?: number | null;
      achievements_earned?: number | null;
      replay_value?: number | null;
    }
  ) => api.put(`/games/${id}/custom-fields`, { platform_id: platformId, ...fields }),
  getAchievements: (id: string, platformId: string) =>
    api.get(`/games/${id}/achievements`, { params: { platform_id: platformId } }),
  updateAchievement: (id: string, platformId: string, achievementId: string, completed: boolean) =>
    api.put(`/games/${id}/achievements/${achievementId}`, { completed, platform_id: platformId }),
  createManualAchievement: (
    id: string,
    platformId: string,
    data: { name: string; description?: string }
  ) => api.post(`/games/${id}/achievements/manual`, { platform_id: platformId, ...data }),
  deleteManualAchievements: (id: string, platformId: string, achievementIds: string[]) =>
    api.post(`/games/${id}/achievements/manual/bulk-delete`, {
      platform_id: platformId,
      achievementIds,
    }),
  updateFromRawg: (id: string, options: { rawgId?: number; rawgSlug?: string }) =>
    api.post(`/games/${id}/update-from-rawg`, options),
  addToPlatform: (id: string, platformId: string) =>
    api.post(`/games/${id}/platforms`, { platformId }),
};

// Import API
export const importAPI = {
  bulk: (gameNames: string[], platformId?: string) =>
    api.post("/import/bulk", { gameNames, platformId }),
  single: (rawgId: number, platformId?: string) =>
    api.post("/import/single", { rawgId, platformId }),
};

// Platforms API
export const platformsAPI = {
  getAll: () => api.get("/platforms"),
  create: (data: { displayName: string; platformType?: string | null }) =>
    api.post("/platforms", data),
};

// Removed rawgPlatformsAPI - platforms are now accessed via platformsAPI

export const userPlatformsAPI = {
  getAll: () => api.get("/user-platforms"),
  getOne: (id: string) => api.get(`/user-platforms/${id}`),
  add: (data: { platformId: string; username?: string; profileUrl?: string; notes?: string }) =>
    api.post("/user-platforms", data),
  update: (
    id: string,
    data: {
      username?: string | null;
      iconUrl?: string | null;
      profileUrl?: string | null;
      notes?: string | null;
    }
  ) => api.patch(`/user-platforms/${id}`, data),
  remove: (id: string) => api.delete(`/user-platforms/${id}`),
};

// Preferences API
export const preferencesAPI = {
  get: () => api.get("/preferences"),
  update: (prefs: { default_view?: "grid" | "table"; items_per_page?: number; theme?: string }) =>
    api.put("/preferences", prefs),
};

// Sessions API
export const sessionsAPI = {
  getAll: (
    gameId: string,
    params?: { limit?: number; offset?: number; startDate?: string; endDate?: string }
  ) => api.get(`/games/${gameId}/sessions`, { params }),
  create: (
    gameId: string,
    data: {
      platformId: string;
      startedAt: string;
      endedAt?: string | null;
      durationMinutes?: number | null;
      notes?: string | null;
    }
  ) => api.post(`/games/${gameId}/sessions`, data),
  update: (
    gameId: string,
    sessionId: string,
    data: {
      startedAt?: string;
      endedAt?: string | null;
      durationMinutes?: number | null;
      notes?: string | null;
    }
  ) => api.patch(`/games/${gameId}/sessions/${sessionId}`, data),
  delete: (gameId: string, sessionId: string) =>
    api.delete(`/games/${gameId}/sessions/${sessionId}`),
  getActive: () => api.get("/sessions/active"),
};

// Completion Logs API
export type CompletionType = "main" | "dlc" | "full" | "completionist";

export const completionLogsAPI = {
  getAll: (
    gameId: string,
    params?: {
      limit?: number;
      offset?: number;
      type?: CompletionType;
      dlcId?: string;
      platform_id?: string;
    }
  ) => api.get(`/games/${gameId}/completion-logs`, { params }),
  create: (
    gameId: string,
    data: {
      platformId: string;
      percentage: number;
      completionType?: CompletionType;
      dlcId?: string | null;
      notes?: string | null;
    }
  ) => api.post(`/games/${gameId}/completion-logs`, data),
  delete: (gameId: string, logId: string) =>
    api.delete(`/games/${gameId}/completion-logs/${logId}`),
  recalculate: (gameId: string, platformId: string) =>
    api.post(`/games/${gameId}/completion-logs/recalculate`, { platformId }),
};

// Game Additions (DLC) API
export type AdditionType = "dlc" | "edition" | "other";

export interface GameAddition {
  id: string;
  game_id: string;
  rawg_addition_id: number;
  name: string;
  slug: string | null;
  released: string | null;
  cover_image_url: string | null;
  addition_type: AdditionType;
  is_complete_edition: boolean;
  weight: number;
  required_for_full: boolean;
  percentage: number;
  owned: boolean;
}

export const additionsAPI = {
  getAll: (gameId: string, platformId?: string) =>
    api.get(`/games/${gameId}/additions`, { params: { platform_id: platformId } }),
  update: (
    gameId: string,
    additionId: string,
    data: { weight?: number; requiredForFull?: boolean }
  ) => api.put(`/games/${gameId}/additions/${additionId}`, data),
  sync: (gameId: string) => api.post(`/games/${gameId}/additions/sync`),
};

// Game Ownership API
export interface EditionInfo {
  id: string;
  name: string;
  is_complete_edition: boolean;
}

export interface DlcInfo {
  id: string;
  name: string;
  weight: number;
  required_for_full: boolean;
}

export interface OwnershipData {
  editionId: string | null;
  editions: EditionInfo[];
  dlcs: DlcInfo[];
  ownedDlcIds: string[];
  hasCompleteEdition: boolean;
}

export const ownershipAPI = {
  get: (gameId: string, platformId: string) =>
    api.get(`/games/${gameId}/ownership`, { params: { platform_id: platformId } }),
  setEdition: (gameId: string, platformId: string, editionId: string | null) =>
    api.put(`/games/${gameId}/ownership/edition`, { platformId, editionId }),
  setDlcs: (gameId: string, platformId: string, dlcIds: string[]) =>
    api.put(`/games/${gameId}/ownership/dlcs`, { platformId, dlcIds }),
};

// Game Display Edition API
export interface DisplayEditionInfo {
  id: string;
  rawg_edition_id: number | null;
  edition_name: string;
  cover_art_url: string | null;
  background_image_url: string | null;
  description: string | null;
}

export interface RawgEditionOption {
  rawg_id: number;
  name: string;
  cover_url: string | null;
  background_url: string | null;
  description: string | null;
}

export interface DisplayEditionData {
  currentDisplay: DisplayEditionInfo | null;
  baseGame: { name: string; rawg_id: number | null } | null;
  availableEditions: RawgEditionOption[];
  isUsingEdition: boolean;
}

export const displayEditionAPI = {
  get: (gameId: string, platformId: string) =>
    api.get(`/games/${gameId}/display-edition`, { params: { platform_id: platformId } }),
  set: (
    gameId: string,
    data: {
      platformId: string;
      rawgEditionId: number;
      editionName: string;
      coverArtUrl: string | null;
      backgroundImageUrl: string | null;
      description: string | null;
    }
  ) => api.put(`/games/${gameId}/display-edition`, data),
  reset: (gameId: string, platformId: string) =>
    api.delete(`/games/${gameId}/display-edition`, { params: { platform_id: platformId } }),
};

// Stats API
export interface AchievementStats {
  summary: {
    totalAchievements: number;
    completedAchievements: number;
    overallPercentage: number;
    gamesWithAchievements: number;
    perfectGames: number;
  };
  rarityBreakdown: {
    legendary: number;
    rare: number;
    uncommon: number;
    common: number;
  };
  rarestUnlocked: Array<{
    gameName: string;
    coverArtUrl: string | null;
    achievementName: string | null;
    rarity: number | null;
  }>;
  gameStats: Array<{
    gameId: string;
    gameName: string;
    coverArtUrl: string | null;
    total: number;
    completed: number;
    percentage: number;
  }>;
}

export interface CombinedHeatmapDay {
  date: string;
  sessions: { count: number; minutes: number };
  completions: { count: number };
  achievements: { count: number };
  total: number;
}

export interface CombinedHeatmapSummary {
  totalSessions: number;
  totalMinutes: number;
  totalHours: number;
  totalCompletions: number;
  totalAchievements: number;
  activeDays: number;
  currentStreak: number;
}

export interface ActivityFeedResponse<T> {
  feed: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ActivityFeedParams {
  limit?: number;
  page?: number;
  pageSize?: number;
}

export const statsAPI = {
  getActivityHeatmap: (year?: number) => api.get("/stats/activity-heatmap", { params: { year } }),
  getCompletionHeatmap: (year?: number) =>
    api.get("/stats/completion-heatmap", { params: { year } }),
  getAchievementHeatmap: (year?: number) =>
    api.get("/stats/achievement-heatmap", { params: { year } }),
  getCombinedHeatmap: (year?: number) =>
    api.get<{ data: CombinedHeatmapDay[]; summary: CombinedHeatmapSummary }>(
      "/stats/combined-heatmap",
      { params: { year } }
    ),
  getActivityFeed: (params?: number | ActivityFeedParams) => {
    if (typeof params === "number") {
      return api.get("/stats/activity-feed", { params: { limit: params } });
    }
    return api.get("/stats/activity-feed", { params });
  },
  getAchievementStats: () => api.get<AchievementStats>("/stats/achievements"),
};

// Collections API
export const collectionsAPI = {
  getAll: () => api.get("/collections"),
  getOne: (id: string) => api.get(`/collections/${id}/games`),
  create: (name: string, description?: string) => api.post("/collections", { name, description }),
  update: (id: string, name: string, description?: string) =>
    api.put(`/collections/${id}`, { name, description }),
  delete: (id: string) => api.delete(`/collections/${id}`),
  addGame: (collectionId: string, gameId: string) =>
    api.post(`/collections/${collectionId}/games`, { game_id: gameId }),
  bulkAddGames: (collectionId: string, gameIds: string[]) =>
    api.post(`/collections/${collectionId}/games/bulk`, { gameIds }),
  removeGame: (collectionId: string, gameId: string) =>
    api.delete(`/collections/${collectionId}/games/${gameId}`),
  getSeries: () => api.get("/collections/series"),
  getSeriesGames: (seriesName: string) =>
    api.get(`/collections/series/${encodeURIComponent(seriesName)}/games`),
  uploadCover: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("cover", file);
    return api.post(`/collections/${id}/cover`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteCover: (id: string) => api.delete(`/collections/${id}/cover`),
};

// Franchises API
export interface FranchiseSummary {
  series_name: string;
  game_count: number;
  cover_art_url: string | null;
}

export interface OwnedGame {
  id: string;
  rawg_id: number | null;
  name: string;
  release_date: string | null;
  cover_art_url: string | null;
  platforms: string[];
  status: string;
}

export interface MissingGame {
  rawgId: number;
  id: number;
  name: string;
  slug: string;
  released: string | null;
  background_image: string | null;
}

export interface FranchiseDetail {
  series_name: string;
  owned_games: OwnedGame[];
  missing_games: MissingGame[];
}

export const franchisesAPI = {
  getAll: () => api.get<{ franchises: FranchiseSummary[] }>("/franchises"),
  getOne: (seriesName: string) =>
    api.get<FranchiseDetail>(`/franchises/${encodeURIComponent(seriesName)}`),
  sync: () =>
    api.post<{ success: boolean; games_checked: number; games_updated: number }>(
      "/franchises/sync"
    ),
  importGame: (rawgId: number, platformId: string, seriesName: string) =>
    api.post<{ success: boolean }>("/franchises/import", { rawgId, platformId, seriesName }),
};

// AI API
export interface AiProviderConfig {
  provider: string;
  base_url: string | null;
  api_key_masked?: string | null;
  model: string;
  image_api_key_masked?: string | null;
  image_model: string | null;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
}

export interface CollectionSuggestion {
  name: string;
  description: string;
  gameNames: string[];
  gameIds: string[];
  reasoning: string;
}

export interface NextGameSuggestion {
  gameName: string;
  reasoning: string;
  estimatedHours?: number | null;
}

export interface AiActivityLog {
  id: string;
  actionType: string;
  provider: string;
  model: string;
  success: boolean;
  estimatedCostUsd: number | null;
  durationMs: number | null;
  createdAt: string;
}

export interface ModelCapability {
  id: string;
  name: string;
  displayName: string;
  pricing: {
    input?: number;
    output?: number;
    perImage?: number;
  };
  capabilities: ("text" | "image")[];
  provider: string;
  context?: number;
}

export interface ModelsResponse {
  textModels: ModelCapability[];
  imageModels: ModelCapability[];
}

export const aiAPI = {
  getSettings: () =>
    api.get<{ providers: AiProviderConfig[]; activeProvider: AiProviderConfig | null }>(
      "/ai/settings"
    ),
  updateSettings: (data: {
    provider: string;
    baseUrl?: string | null;
    apiKey?: string | null;
    model?: string;
    imageApiKey?: string | null;
    imageModel?: string | null;
    temperature?: number;
    maxTokens?: number;
    setActive?: boolean;
  }) => api.put("/ai/settings", data),
  setActiveProvider: (provider: string) => api.post("/ai/set-active-provider", { provider }),
  getModels: (provider: string) => api.get<ModelsResponse>(`/ai/models/${provider}`),
  suggestCollections: (theme?: string) =>
    api.post<{ collections: CollectionSuggestion[]; cost: number }>(
      "/ai/suggest-collections",
      { theme },
      {
        timeout: 120000,
      }
    ),
  suggestNextGame: (userInput?: string) =>
    api.post<{ suggestion: NextGameSuggestion; cost: number }>(
      "/ai/suggest-next-game",
      { userInput },
      {
        timeout: 120000,
      }
    ),
  generateCover: (collectionName: string, collectionDescription: string, collectionId: string) =>
    api.post<{ imageUrl: string; cost: number }>(
      "/ai/generate-cover",
      {
        collectionName,
        collectionDescription,
        collectionId,
      },
      {
        timeout: 180000,
      }
    ),
  getActivity: (limit?: number) =>
    api.get<{ logs: AiActivityLog[] }>("/ai/activity", { params: { limit } }),
  estimateCost: (actionType: string) =>
    api.post<{ estimatedCostUsd: number }>("/ai/estimate-cost", { actionType }),
};
