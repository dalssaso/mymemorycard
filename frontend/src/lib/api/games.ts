import { api } from "./axios"

export const gamesAPI = {
  getAll: (params?: {
    platform?: string
    status?: string
    favorites?: boolean
    genre?: string
    collection?: string
    franchise?: string
    sort?: string
  }) => {
    if (!params) return api.get("/games")
    const searchParams = new URLSearchParams()
    if (params.platform) searchParams.set("platform", params.platform)
    if (params.status) searchParams.set("status", params.status)
    if (params.favorites) searchParams.set("favorites", "true")
    if (params.genre) searchParams.set("genre", params.genre)
    if (params.collection) searchParams.set("collection", params.collection)
    if (params.franchise) searchParams.set("franchise", params.franchise)
    if (params.sort) searchParams.set("sort", params.sort)
    return api.get(`/games?${searchParams.toString()}`)
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
      estimated_completion_hours?: number | null
      actual_playtime_hours?: number | null
      completion_percentage?: number | null
      difficulty_rating?: number | null
      achievements_total?: number | null
      achievements_earned?: number | null
      replay_value?: number | null
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
}
