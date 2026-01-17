import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock auth-storage before importing client
vi.mock("@/lib/auth-storage", () => ({
  getToken: vi.fn(),
  clearToken: vi.fn(),
}));

import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { getToken, clearToken } from "@/lib/auth-storage";
import { apiClient, AUTH_UNAUTHORIZED_EVENT } from "../client";

describe("API Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("configuration", () => {
    it("should create axios instance with /api/v1 base URL", () => {
      expect(apiClient.defaults.baseURL).toBe("/api/v1");
    });

    it("should have Content-Type header set to application/json", () => {
      expect(apiClient.defaults.headers["Content-Type"]).toBe("application/json");
    });

    it("should have withCredentials enabled", () => {
      expect(apiClient.defaults.withCredentials).toBe(true);
    });

    it("should have request interceptors defined", () => {
      expect(apiClient.interceptors.request).toBeDefined();
    });

    it("should have response interceptors defined", () => {
      expect(apiClient.interceptors.response).toBeDefined();
    });
  });

  describe("request interceptor", () => {
    it("should add Authorization header when token exists", async () => {
      vi.mocked(getToken).mockReturnValue("test-token");

      const config: InternalAxiosRequestConfig = {
        headers: {} as InternalAxiosRequestConfig["headers"],
        url: "/games",
      };

      // Execute the request interceptor
      const handlers = apiClient.interceptors.request as unknown as {
        handlers: Array<{
          fulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
        }>;
      };
      const interceptor = handlers.handlers[0].fulfilled;
      const result = interceptor(config);

      expect(result.headers.Authorization).toBe("Bearer test-token");
    });

    it("should not add Authorization header when token is null", async () => {
      vi.mocked(getToken).mockReturnValue(null);

      const config: InternalAxiosRequestConfig = {
        headers: {} as InternalAxiosRequestConfig["headers"],
        url: "/games",
      };

      const handlers = apiClient.interceptors.request as unknown as {
        handlers: Array<{
          fulfilled: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
        }>;
      };
      const interceptor = handlers.handlers[0].fulfilled;
      const result = interceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe("response interceptor", () => {
    it("should pass through successful responses", async () => {
      const mockResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      const handlers = apiClient.interceptors.response as unknown as {
        handlers: Array<{
          fulfilled: (response: AxiosResponse) => AxiosResponse;
          rejected: (error: unknown) => Promise<never>;
        }>;
      };
      const interceptor = handlers.handlers[0].fulfilled;
      const result = interceptor(mockResponse);

      expect(result).toBe(mockResponse);
    });

    it("should clear token and dispatch event on 401 response", async () => {
      const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

      const error = {
        response: {
          status: 401,
        },
      };

      const handlers = apiClient.interceptors.response as unknown as {
        handlers: Array<{
          fulfilled: (response: AxiosResponse) => AxiosResponse;
          rejected: (error: unknown) => Promise<never>;
        }>;
      };
      const interceptor = handlers.handlers[0].rejected;

      await expect(interceptor(error)).rejects.toBe(error);
      expect(clearToken).toHaveBeenCalled();
      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(CustomEvent));

      const calledEvent = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
      expect(calledEvent.type).toBe(AUTH_UNAUTHORIZED_EVENT);
    });

    it("should not clear token for non-401 errors", async () => {
      const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");

      const error = {
        response: {
          status: 500,
        },
      };

      const handlers = apiClient.interceptors.response as unknown as {
        handlers: Array<{
          fulfilled: (response: AxiosResponse) => AxiosResponse;
          rejected: (error: unknown) => Promise<never>;
        }>;
      };
      const interceptor = handlers.handlers[0].rejected;

      await expect(interceptor(error)).rejects.toBe(error);
      expect(clearToken).not.toHaveBeenCalled();
      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });
  });

  describe("AUTH_UNAUTHORIZED_EVENT", () => {
    it("should export AUTH_UNAUTHORIZED_EVENT constant", () => {
      expect(AUTH_UNAUTHORIZED_EVENT).toBe("auth:unauthorized");
    });
  });
});
