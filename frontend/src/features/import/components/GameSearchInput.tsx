import { useState, useCallback } from "react"
import { useSearchGames } from "@/features/library/hooks/useSearchGames"
import { Input } from "@/components/ui/input"
import type { GameSearchResult } from "@/shared/api/services"

/** Props for the GameSearchInput component */
interface GameSearchInputProps {
  /** Callback when a game is selected from search results */
  onSelect: (game: GameSearchResult) => void
}

/**
 * Server-side game search with debouncing, results list, and result selection.
 * Shows loading spinner while searching and displays results in a dropdown.
 */
export function GameSearchInput({ onSelect }: GameSearchInputProps): JSX.Element {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const { results, isLoading, isError } = useSearchGames(query, 300)

  const handleSelect = useCallback(
    (game: GameSearchResult): void => {
      onSelect(game)
      setQuery("")
      setIsOpen(false)
    },
    [onSelect]
  )

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search games..."
          className="w-full bg-base text-text-primary placeholder-text-muted"
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2" role="progressbar">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
          </div>
        )}
      </div>

      {isError && (
        <div className="absolute inset-x-0 top-full mt-1 rounded border border-destructive bg-destructive/30 p-2 text-sm text-destructive">
          Failed to search. Please try again.
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute inset-x-0 top-full mt-1 max-h-96 overflow-y-auto rounded border border-border bg-surface shadow-lg">
          {results.map((game) => (
            <button
              key={game.igdb_id}
              onClick={() => handleSelect(game)}
              className="flex w-full items-center gap-3 border-b border-border p-3 text-left hover:bg-muted"
              type="button"
            >
              {game.cover_art_url && (
                <img
                  src={game.cover_art_url}
                  alt={game.name}
                  className="h-12 w-9 flex-shrink-0 rounded object-cover"
                />
              )}

              <div className="flex-1">
                <div className="font-medium text-text-primary">{game.name}</div>
                {game.release_date && (
                  <div className="text-xs text-text-secondary">{game.release_date}</div>
                )}
                {game.platforms.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {game.platforms.slice(0, 3).map((platform) => (
                      <span
                        key={platform.igdb_platform_id}
                        className="rounded bg-muted px-2 py-0.5 text-xs text-text-secondary"
                      >
                        {platform.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length > 0 && !isLoading && results.length === 0 && (
        <div className="absolute inset-x-0 top-full mt-1 rounded border border-border bg-surface p-3 text-center text-sm text-text-secondary">
          No games found. Try a different search.
        </div>
      )}
    </div>
  )
}
