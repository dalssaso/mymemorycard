import { api } from "./axios";

export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { username: string; password: string }) => api.post("/auth/login", data),
  me: (signal?: AbortSignal) => api.get("/auth/me", { signal }),
};
