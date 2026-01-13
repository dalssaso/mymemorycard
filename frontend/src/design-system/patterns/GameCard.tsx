import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { gamesAPI } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge, Button } from "@/components/ui";
import { AddToCollection } from "@/components/AddToCollection";
import { PlatformIcons } from "@/components/PlatformIcon";
import { getStatusConfig } from "@/lib/constants/status";
import { cn } from "@/lib/utils";

interface GameCardProps {
  id: string;
  name: string;
  cover_art_url: string | null;
  platforms: {
    id: string;
    name: string;
    displayName: string;
    iconUrl?: string | null;
    colorPrimary: string;
  }[];
  status: string;
  metacritic_score: number | null;
  user_rating: number | null;
  total_minutes: number;
  is_favorite: boolean;
  series_name?: string | null;
}

export function GameCard({
  id,
  name,
  cover_art_url: coverArtUrl,
  platforms,
  status,
  metacritic_score: metacriticScore,
  user_rating: userRating,
  total_minutes: totalMinutes,
  is_favorite: isFavoriteProp,
  series_name: seriesName,
}: GameCardProps): JSX.Element {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(isFavoriteProp);

  const toggleFavoriteMutation = useMutation({
    mutationFn: (newFavorite: boolean) =>
      gamesAPI.toggleFavorite(id, platforms[0]?.id || "", newFavorite),
    onMutate: async (newFavorite) => {
      setIsFavorite(newFavorite);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
    onError: () => {
      setIsFavorite(!isFavorite);
    },
  });

  const handleFavoriteClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteMutation.mutate(!isFavorite);
  };

  const statusConfig = getStatusConfig(status);

  return (
    <Link
      to="/library/$id"
      params={{ id }}
      className="bg-surface/40 group relative cursor-pointer rounded-xl border border-border p-0 transition-all duration-standard hover:border-accent sm:p-5"
    >
      {/* Mobile: Poster-only layout with overlay */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg sm:hidden">
        {coverArtUrl ? (
          <img src={coverArtUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-base">
            <span className="text-sm text-text-secondary">No image</span>
          </div>
        )}
        <div className="from-base/70 via-base/20 absolute inset-0 bg-gradient-to-t to-transparent dark:via-transparent dark:to-transparent" />
        <div className="bg-base/60 absolute bottom-0 left-0 right-0 p-3">
          <div className="mb-1 flex gap-1">
            <PlatformIcons platforms={platforms} size="xs" maxDisplay={5} />
          </div>
          <h3 className="line-clamp-2 text-sm font-bold transition-colors duration-standard group-hover:text-accent">
            {name}
          </h3>
        </div>
        <Button
          onClick={handleFavoriteClick}
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10 text-status-favorites transition-transform duration-standard hover:scale-110"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </Button>
      </div>

      {/* Desktop: Full card layout */}
      <div className="hidden gap-4 sm:flex">
        <div className="relative shrink-0">
          {coverArtUrl ? (
            <img src={coverArtUrl} alt={name} className="h-32 w-24 rounded object-cover" />
          ) : (
            <div className="flex h-32 w-24 items-center justify-center rounded bg-base">
              <span className="text-xs text-text-secondary">No image</span>
            </div>
          )}
          <Button
            onClick={handleFavoriteClick}
            variant="ghost"
            size="icon"
            className="absolute -right-2 -top-2 z-10 text-status-favorites transition-transform duration-standard hover:scale-110"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill={isFavorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </Button>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="mb-2 break-words text-lg font-bold transition-colors duration-standard group-hover:text-accent">
            {name}
          </h3>

          <div className="mb-2 flex flex-wrap items-center gap-2">
            <PlatformIcons platforms={platforms} size="sm" maxDisplay={5} />
            <Badge className="border text-text-primary" style={statusConfig?.activeStyle}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
            {seriesName && (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate({
                    to: "/franchises/$seriesName",
                    params: { seriesName },
                  });
                }}
                className={cn(
                  "inline-flex h-auto items-center rounded border px-2 py-1 text-xs font-medium",
                  "bg-elevated text-text-secondary",
                  "hover:bg-elevated-hover transition-colors duration-standard hover:text-text-primary"
                )}
              >
                {seriesName}
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
            {metacriticScore && (
              <div className="flex items-center gap-1">
                <span className="text-status-playing">Metacritic:</span>
                <span>{metacriticScore}</span>
              </div>
            )}

            {userRating && (
              <div className="flex items-center gap-1">
                <span className="text-accent">Your rating:</span>
                <span>{userRating}/10</span>
              </div>
            )}

            {totalMinutes > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-text-muted">Time:</span>
                <span>
                  {hours > 0 && `${hours}h `}
                  {minutes}m
                </span>
              </div>
            )}
          </div>

          <div className="mt-3">
            <AddToCollection gameId={id} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export type { GameCardProps };
