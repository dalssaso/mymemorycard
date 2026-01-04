import { api } from "./axios"

export interface EditionInfo {
  id: string
  name: string
  is_complete_edition: boolean
}

export interface DlcInfo {
  id: string
  name: string
  weight: number
  required_for_full: boolean
}

export interface OwnershipData {
  editionId: string | null
  editions: EditionInfo[]
  dlcs: DlcInfo[]
  ownedDlcIds: string[]
  hasCompleteEdition: boolean
}

export const ownershipAPI = {
  get: (gameId: string, platformId: string) =>
    api.get(`/games/${gameId}/ownership`, { params: { platform_id: platformId } }),
  setEdition: (gameId: string, platformId: string, editionId: string | null) =>
    api.put(`/games/${gameId}/ownership/edition`, { platformId, editionId }),
  setDlcs: (gameId: string, platformId: string, dlcIds: string[]) =>
    api.put(`/games/${gameId}/ownership/dlcs`, { platformId, dlcIds }),
}
