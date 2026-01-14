import axios from "axios";
import { clearToken, getToken } from "@/lib/auth-storage";
import {
  type GetApiV1AuthMeResponse,
  type PostApiV1AuthLoginResponse,
  type PostApiV1AuthRegisterResponse,
  getApiV1AuthMe,
  postApiV1AuthLogin,
  postApiV1AuthRegister,
} from "@/shared/api/generated";
import { client } from "@/shared/api/generated/client.gen";
import type { Auth } from "@/shared/api/generated/client";

const AUTH_EVENT = "auth:unauthorized";

const resolveAuthToken = (_auth: Auth): string => getToken() ?? "";

client.setConfig({
  auth: resolveAuthToken,
  baseURL: "/",
  withCredentials: true,
});

const handleAuthError = (error: unknown): never => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(AUTH_EVENT));
    }
  }
  throw error;
};

export const authAPI = {
  register: (data: {
    username: string;
    email: string;
    password: string;
  }): Promise<PostApiV1AuthRegisterResponse> =>
    postApiV1AuthRegister({ body: data, throwOnError: true })
      .then((response) => response.data)
      .catch(handleAuthError),
  login: (data: { username: string; password: string }): Promise<PostApiV1AuthLoginResponse> =>
    postApiV1AuthLogin({ body: data, throwOnError: true })
      .then((response) => response.data)
      .catch(handleAuthError),
  me: (): Promise<GetApiV1AuthMeResponse> =>
    getApiV1AuthMe({ throwOnError: true })
      .then((response) => response.data)
      .catch(handleAuthError),
};
