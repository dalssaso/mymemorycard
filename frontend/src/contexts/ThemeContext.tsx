import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { preferencesAPI } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";

type Theme = "light" | "dark" | "auto";

type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_OPTIONS: Theme[] = ["light", "dark", "auto"];

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [theme, setThemeState] = useState<Theme>("auto");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateResolvedTheme = () => {
      if (theme === "auto") {
        setResolvedTheme(mediaQuery.matches ? "dark" : "light");
        return;
      }

      setResolvedTheme(theme);
    };

    updateResolvedTheme();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateResolvedTheme);
      return () => mediaQuery.removeEventListener("change", updateResolvedTheme);
    }

    mediaQuery.addListener(updateResolvedTheme);
    return () => mediaQuery.removeListener(updateResolvedTheme);
  }, [theme]);

  useEffect(() => {
    if (resolvedTheme === "dark") {
      document.documentElement.classList.add("dark");
      return;
    }

    document.documentElement.classList.remove("dark");
  }, [resolvedTheme]);

  useEffect(() => {
    const loadTheme = async () => {
      if (!getToken()) {
        return;
      }

      try {
        const response = await preferencesAPI.get();
        const savedTheme = response.data?.preferences?.theme as Theme | undefined;

        if (savedTheme && THEME_OPTIONS.includes(savedTheme)) {
          setThemeState(savedTheme);
        }
      } catch {
        // Ignore preference load errors.
      }
    };

    loadTheme();
  }, []);

  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);

    if (!getToken()) {
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      preferencesAPI.update({ theme: newTheme }).catch(() => {
        // Ignore failed preference updates.
      });
    }, 500);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
