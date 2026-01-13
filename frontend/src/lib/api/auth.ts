import { clearToken, getToken } from "@/lib/auth-storage"
import { ApiError } from "@/shared/api/generated/core/ApiError"
import { OpenAPI } from "@/shared/api/generated/core/OpenAPI"
import { AuthService } from "@/shared/api/generated/services/AuthService"

const AUTH_EVENT = "auth:unauthorized"

OpenAPI.WITH_CREDENTIALS = true
OpenAPI.CREDENTIALS = "include"
OpenAPI.TOKEN = async (options) => {
  const token = getToken()
  if (!token) {
    return undefined
  }

  const isAuthExempt =
    options.url.includes("/api/v1/auth/login") ||
    options.url.includes("/api/v1/auth/register") ||
    options.url.includes("/api/v1/auth/refresh")

  return isAuthExempt ? undefined : token
}

const handleAuthError = (error: unknown): never => {
  if (error instanceof ApiError && error.status === 401) {
    clearToken()
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(AUTH_EVENT))
    }
  }
  throw error
}

export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    AuthService.postApiV1AuthRegister({ requestBody: data }).catch(handleAuthError),
  login: (data: { username: string; password: string }) =>
    AuthService.postApiV1AuthLogin({ requestBody: data }).catch(handleAuthError),
  me: () => AuthService.getApiV1AuthMe().catch(handleAuthError),
}
