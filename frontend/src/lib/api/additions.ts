import { api } from "./axios";

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
