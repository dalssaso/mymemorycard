import { api } from "./axios";

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
