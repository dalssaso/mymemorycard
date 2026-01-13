import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authAPI } from "@/lib/api";
import { clearToken, getToken, setToken, subscribe } from "@/lib/auth-storage";

interface User {
  id: string;
  username: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [token, setTokenState] = useState<string | null>(getToken());
  const queryClient = useQueryClient();

  useEffect(() => {
    return subscribe((nextToken) => {
      setTokenState(nextToken);
    });
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await authAPI.me();
      return (response.user ?? response) as User;
    },
    enabled: Boolean(token),
    retry: false,
  });

  const login = useCallback(
    async (username: string, password: string) => {
      const response = await authAPI.login({ username, password });
      const { user: userData, token: userToken } = response as {
        user: User;
        token: string;
      };

      setToken(userToken);
      queryClient.setQueryData(["auth", "me"], userData);
    },
    [queryClient]
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const response = await authAPI.register({ username, email, password });
      const { user: userData, token: userToken } = response as {
        user: User;
        token: string;
      };

      setToken(userToken);
      queryClient.setQueryData(["auth", "me"], userData);
    },
    [queryClient]
  );

  const logout = useCallback(() => {
    clearToken();
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextType>(
    () => ({
      user: user ?? null,
      token,
      isLoading: token ? isLoading : false,
      login,
      register,
      logout,
    }),
    [isLoading, login, logout, register, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
