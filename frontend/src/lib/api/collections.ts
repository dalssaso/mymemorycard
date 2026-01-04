import { api } from "./axios"

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
    const formData = new FormData()
    formData.append("cover", file)
    return api.post(`/collections/${id}/cover`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
  deleteCover: (id: string) => api.delete(`/collections/${id}/cover`),
}
