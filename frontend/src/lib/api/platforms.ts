import { api } from "./axios";

export const platformsAPI = {
  getAll: () => api.get("/platforms"),
  create: (data: { displayName: string; platformType?: string | null }) =>
    api.post("/platforms", data),
};
