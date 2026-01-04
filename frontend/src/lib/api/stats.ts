import { api } from "./axios"

export interface AchievementStats {
  summary: {
    totalAchievements: number
    completedAchievements: number
    overallPercentage: number
    gamesWithAchievements: number
    perfectGames: number
  }
  rarityBreakdown: {
    legendary: number
    rare: number
    uncommon: number
    common: number
  }
  rarestUnlocked: Array<{
    gameName: string
    coverArtUrl: string | null
    achievementName: string | null
    rarity: number | null
  }>
  gameStats: Array<{
    gameId: string
    gameName: string
    coverArtUrl: string | null
    total: number
    completed: number
    percentage: number
  }>
}

export interface CombinedHeatmapDay {
  date: string
  sessions: { count: number; minutes: number }
  completions: { count: number }
  achievements: { count: number }
  total: number
}

export interface CombinedHeatmapSummary {
  totalSessions: number
  totalMinutes: number
  totalHours: number
  totalCompletions: number
  totalAchievements: number
  activeDays: number
  currentStreak: number
}

export interface ActivityFeedResponse<T> {
  feed: T[]
  total: number
  page: number
  pageSize: number
}

export interface ActivityFeedParams {
  limit?: number
  page?: number
  pageSize?: number
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
      return api.get("/stats/activity-feed", { params: { limit: params } })
    }
    return api.get("/stats/activity-feed", { params })
  },
  getAchievementStats: () => api.get<AchievementStats>("/stats/achievements"),
}
