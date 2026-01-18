import axios, { type AxiosInstance } from "axios";
import { clearToken, getToken } from "@/lib/auth-storage";

/**
 * Event name dispatched when a 401 Unauthorized response is received.
 * Components can listen for this event to handle authentication failures.
 */
export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

/**
 * Configured axios instance for /api/v1 endpoints.
 *
 * Features:
 * - Base URL set to /api/v1
 * - Automatic Bearer token injection from auth storage
 * - 401 response handling with token cleanup and event dispatch
 * - withCredentials enabled for cookie support
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor: adds Bearer token from auth storage
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor: handles 401 by clearing token and dispatching event
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
