import { api } from "./axios";

export const userPlatformsAPI = {
  getAll: () => api.get("/user-platforms"),
  getOne: (id: string) => api.get(`/user-platforms/${id}`),
  add: (data: { platformId: string; username?: string; profileUrl?: string; notes?: string }) =>
    api.post("/user-platforms", data),
  update: (
    id: string,
    data: {
      username?: string | null;
      iconUrl?: string | null;
      profileUrl?: string | null;
      notes?: string | null;
    }
  ) => api.patch(`/user-platforms/${id}`, data),
  remove: (id: string) => api.delete(`/user-platforms/${id}`),
};
