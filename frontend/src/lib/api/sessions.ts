import { api } from "./axios";

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
