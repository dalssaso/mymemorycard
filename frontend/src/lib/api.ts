import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Games API
export const gamesAPI = {
  getAll: () => api.get('/games'),
  getGenreStats: () => api.get('/games/stats/genres'),
  export: (format: 'json' | 'csv') => api.get(`/games/export?format=${format}`, { responseType: 'blob' }),
  getOne: (id: string) => api.get(`/games/${id}`),
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
  updateCustomFields: (id: string, platformId: string, fields: {
    estimated_completion_hours?: number | null
    actual_playtime_hours?: number | null
    completion_percentage?: number | null
    difficulty_rating?: number | null
    achievements_total?: number | null
    achievements_earned?: number | null
    replay_value?: number | null
  }) =>
    api.put(`/games/${id}/custom-fields`, { platform_id: platformId, ...fields }),
  getAchievements: (id: string) =>
    api.get(`/games/${id}/achievements`),
  updateAchievement: (id: string, achievementId: number, completed: boolean) =>
    api.put(`/games/${id}/achievements/${achievementId}`, { completed }),
};

// Import API
export const importAPI = {
  bulk: (gameNames: string[], platformId?: string) =>
    api.post('/import/bulk', { gameNames, platformId }),
}

// Platforms API
export const platformsAPI = {
  getAll: () => api.get('/platforms'),
};

// Preferences API
export const preferencesAPI = {
  get: () => api.get('/preferences'),
  update: (prefs: {
    default_view?: 'grid' | 'table'
    items_per_page?: number
    theme?: string
  }) => api.put('/preferences', prefs),
}

// Sessions API
export const sessionsAPI = {
  getAll: (gameId: string, params?: { limit?: number; offset?: number; startDate?: string; endDate?: string }) =>
    api.get(`/games/${gameId}/sessions`, { params }),
  create: (gameId: string, data: {
    platformId: string
    startedAt: string
    endedAt?: string | null
    durationMinutes?: number | null
    notes?: string | null
  }) => api.post(`/games/${gameId}/sessions`, data),
  update: (gameId: string, sessionId: string, data: {
    endedAt?: string | null
    durationMinutes?: number | null
    notes?: string | null
  }) => api.patch(`/games/${gameId}/sessions/${sessionId}`, data),
  delete: (gameId: string, sessionId: string) =>
    api.delete(`/games/${gameId}/sessions/${sessionId}`),
  getActive: () => api.get('/sessions/active'),
}

// Completion Logs API
export const completionLogsAPI = {
  getAll: (gameId: string, params?: { limit?: number; offset?: number }) =>
    api.get(`/games/${gameId}/completion-logs`, { params }),
  create: (gameId: string, data: {
    platformId: string
    percentage: number
    notes?: string | null
  }) => api.post(`/games/${gameId}/completion-logs`, data),
  delete: (gameId: string, logId: string) =>
    api.delete(`/games/${gameId}/completion-logs/${logId}`),
}

// Stats API
export const statsAPI = {
  getActivityHeatmap: (year?: number) =>
    api.get('/stats/activity-heatmap', { params: { year } }),
  getCompletionHeatmap: (year?: number) =>
    api.get('/stats/completion-heatmap', { params: { year } }),
  getActivityFeed: (limit?: number) =>
    api.get('/stats/activity-feed', { params: { limit } }),
}

// Collections API
export const collectionsAPI = {
  getAll: () => api.get('/collections'),
  getOne: (id: string) => api.get(`/collections/${id}/games`),
  create: (name: string, description?: string) =>
    api.post('/collections', { name, description }),
  update: (id: string, name: string, description?: string) =>
    api.put(`/collections/${id}`, { name, description }),
  delete: (id: string) => api.delete(`/collections/${id}`),
  addGame: (collectionId: string, gameId: string) =>
    api.post(`/collections/${collectionId}/games`, { game_id: gameId }),
  removeGame: (collectionId: string, gameId: string) =>
    api.delete(`/collections/${collectionId}/games/${gameId}`),
  getSeries: () => api.get('/collections/series'),
  getSeriesGames: (seriesName: string) =>
    api.get(`/collections/series/${encodeURIComponent(seriesName)}/games`),
};
