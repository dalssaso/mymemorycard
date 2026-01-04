import { api } from "./axios"

export const importAPI = {
  bulk: (gameNames: string[], platformId?: string) =>
    api.post("/import/bulk", { gameNames, platformId }),
  single: (rawgId: number, platformId?: string) =>
    api.post("/import/single", { rawgId, platformId }),
}
