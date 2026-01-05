import axios from "axios";
import { clearToken, getToken } from "@/lib/auth-storage";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_EVENT = "auth:unauthorized";

api.interceptors.request.use((config) => {
  const token = getToken();
  const url = config.url ?? "";
  const isAuthExempt =
    url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh");

  if (!token && !isAuthExempt) {
    throw new axios.CanceledError("Auth token missing");
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    if (error.response?.status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(AUTH_EVENT));
      }
    }
    return Promise.reject(error);
  }
);
