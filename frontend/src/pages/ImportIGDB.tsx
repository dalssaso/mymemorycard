import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui";
import { useCredentials } from "@/features/credentials/hooks/useCredentials";
import { useCreateGame } from "@/features/library/hooks/useGames";
import { GameSearchInput } from "@/features/import/components/GameSearchInput";
import { PlatformStoreSelector } from "@/features/import/components/PlatformStoreSelector";
import { useCredentialsStore, type CredentialsStore } from "@/shared/stores/credentialsStore";
import type { GameSearchResult } from "@/shared/api/services";

/**
 * Game import flow page combining IGDB search, platform selection, and import.
 * Only accessible after IGDB credentials are configured.
 */
export function ImportIGDB(): JSX.Element {
  const [selectedGame, setSelectedGame] = useState<GameSearchResult | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const {
    data: credentialsData,
    isLoading: isCredentialsLoading,
    isError: isCredentialsError,
    error: credentialsError,
    refetch: refetchCredentials,
  } = useCredentials();
  const hasIgdbCredentialsFn = useCredentialsStore((s: CredentialsStore) => s.hasIgdbCredentials);
  const isIgdbTokenExpiredFn = useCredentialsStore((s: CredentialsStore) => s.isIgdbTokenExpired);
  const hasIgdbCredentials = hasIgdbCredentialsFn();
  const isIgdbTokenExpired = isIgdbTokenExpiredFn();
  const navigate = useNavigate();
  const importGame = useCreateGame();

  const igdbCredential = credentialsData?.services?.find((c) => c.service === "igdb");

  // Navigate to library after successful import with cleanup to prevent memory leaks
  useEffect(() => {
    if (!importSuccess) return;

    const timer = setTimeout(() => {
      navigate({ to: "/library" });
    }, 1500);

    return () => clearTimeout(timer);
  }, [importSuccess, navigate]);

  // Show loading state while credentials are being fetched
  if (isCredentialsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-text-secondary">Loading credentials...</div>
      </div>
    );
  }

  // Show error state if credentials fetch failed
  if (isCredentialsError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="bg-destructive/30 max-w-md rounded-lg border border-destructive p-6">
          <h2 className="text-lg font-semibold text-destructive">Failed to Load Credentials</h2>
          <p className="mt-2 text-sm text-destructive-foreground">
            {credentialsError?.message || "An error occurred while loading credentials."}
          </p>
          <Button onClick={() => refetchCredentials()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show credential setup message if IGDB is not configured
  if (!hasIgdbCredentials || !igdbCredential?.is_active) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="bg-status-completed/30 max-w-md rounded-lg border border-status-completed p-6">
          <h2 className="text-lg font-semibold text-status-completed">IGDB Credentials Required</h2>
          <p className="mt-2 text-sm text-foreground">
            Please configure your IGDB credentials in Settings before importing games.
          </p>

          {isIgdbTokenExpired && (
            <p className="mt-2 text-sm text-destructive">
              Your IGDB token has expired. Please refresh your credentials.
            </p>
          )}

          <Button asChild className="mt-4">
            <Link to="/settings">Go to Settings</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleGameSelect = (game: GameSearchResult): void => {
    setSelectedGame(game);
    setImportSuccess(null);
  };

  const handleImport = (platformId: string, storeId: string): void => {
    if (!selectedGame) return;

    importGame.mutate(
      {
        igdb_id: selectedGame.igdb_id,
        platform_id: platformId,
        store_id: storeId,
      },
      {
        onSuccess: (game) => {
          setImportSuccess(game.name);
          setSelectedGame(null);
        },
      }
    );
  };

  const handleClearSelection = (): void => {
    setSelectedGame(null);
    setImportSuccess(null);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Import Games</h1>
        <p className="mt-2 text-text-secondary">
          Search IGDB to find and import games to your library
        </p>
      </div>

      {importSuccess && (
        <div className="bg-status-playing/30 rounded-lg p-4 text-status-playing">
          Successfully imported {importSuccess}! Redirecting to library...
        </div>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Search IGDB</h2>
        <GameSearchInput onSelect={handleGameSelect} />
      </div>

      {selectedGame && (
        <div className="bg-surface/50 space-y-4 rounded-lg border border-border p-6">
          <div className="flex gap-4">
            {selectedGame.cover_art_url && (
              <img
                src={selectedGame.cover_art_url}
                alt={selectedGame.name}
                className="h-32 w-24 flex-shrink-0 rounded object-cover"
              />
            )}

            <div className="flex-1">
              <h3 className="text-xl font-semibold text-text-primary">{selectedGame.name}</h3>
              {selectedGame.release_date && (
                <p className="text-sm text-text-secondary">{selectedGame.release_date}</p>
              )}

              <div className="mt-4 space-y-2">
                {selectedGame.platforms.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold uppercase text-text-muted">
                      Platforms
                    </span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedGame.platforms.map((p) => (
                        <span
                          key={p.igdb_platform_id}
                          className="rounded bg-surface px-3 py-1 text-sm text-text-secondary"
                        >
                          {p.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedGame.stores.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold uppercase text-text-muted">
                      Available On
                    </span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedGame.stores.map((s) => (
                        <span
                          key={s.slug}
                          className="bg-accent/50 rounded px-3 py-1 text-sm text-accent"
                        >
                          {s.display_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearSelection}
              className="self-start text-text-muted hover:text-text-primary"
              aria-label="Clear selection"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="border-t border-border pt-4">
            <PlatformStoreSelector
              platforms={selectedGame.platforms}
              suggestedStores={selectedGame.stores}
              onSelect={handleImport}
            />
          </div>

          {importGame.isError && (
            <div className="bg-destructive/30 rounded p-3 text-sm text-destructive">
              Failed to import game. Please try again.
            </div>
          )}

          {importGame.isPending && (
            <div className="bg-accent/30 rounded p-3 text-sm text-accent">Importing game...</div>
          )}
        </div>
      )}
    </div>
  );
}
