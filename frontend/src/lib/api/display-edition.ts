import { api } from "./axios";

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
