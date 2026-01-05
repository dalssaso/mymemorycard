import { api } from "./axios";

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
