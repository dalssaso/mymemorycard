import { api } from "./axios";

export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post("/v1/auth/register", data),
  login: (data: { username: string; password: string }) =>
    api.post("/v1/auth/login", data),
  me: (signal?: AbortSignal) => api.get("/v1/auth/me", { signal }),
}
