import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CredentialStatus } from "@/shared/types/games";

interface CredentialsStore {
  /** List of configured credential statuses. */
  credentials: CredentialStatus[];

  /**
   * Update the credentials list in the store.
   * @param credentials - Array of credential statuses
   */
  setCredentials: (credentials: CredentialStatus[]) => void;

  /**
   * Check if IGDB credentials are configured and active.
   * @returns True if IGDB credentials exist and are active
   */
  hasIgdbCredentials: () => boolean;

  /**
   * Check if Steam credentials are configured and active.
   * @returns True if Steam credentials exist and are active
   */
  hasSteamCredentials: () => boolean;

  /**
   * Check if RetroAchievements credentials are configured and active.
   * @returns True if RetroAchievements credentials exist and are active
   */
  hasRetroAchievementsCredentials: () => boolean;

  /**
   * Check if the IGDB OAuth token has expired.
   * @returns True if token_expires_at is in the past
   */
  isIgdbTokenExpired: () => boolean;
}

/**
 * Zustand store for credential status and UI state.
 * Persisted to localStorage for session continuity.
 */
export const useCredentialsStore = create<CredentialsStore>()(
  persist(
    (set, get) => ({
      credentials: [],

      setCredentials: (credentials) => set({ credentials }),

      hasIgdbCredentials: () => {
        const igdb = get().credentials.find((c) => c.service === "igdb");
        return igdb?.is_active ?? false;
      },

      hasSteamCredentials: () => {
        const steam = get().credentials.find((c) => c.service === "steam");
        return steam?.is_active ?? false;
      },

      hasRetroAchievementsCredentials: () => {
        const retro = get().credentials.find((c) => c.service === "retroachievements");
        return retro?.is_active ?? false;
      },

      isIgdbTokenExpired: () => {
        const igdb = get().credentials.find((c) => c.service === "igdb");
        if (!igdb?.token_expires_at) return false;
        return new Date(igdb.token_expires_at) < new Date();
      },
    }),
    {
      name: "credentials-store",
    }
  )
);
