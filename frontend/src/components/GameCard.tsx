import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type CSSProperties } from "react";
import { gamesAPI } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge, Button } from "@/components/ui";
import { AddToCollection } from "./AddToCollection";
import { PlatformIcons } from "./PlatformIcon";

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

const STATUS_STYLES: Record<string, CSSProperties> = {
  backlog: {
    backgroundColor: "color-mix(in srgb, var(--ctp-subtext1) 35%, transparent)",
    borderColor: "color-mix(in srgb, var(--ctp-subtext1) 55%, transparent)",
  },
  playing: {
    backgroundColor: "color-mix(in srgb, var(--ctp-teal) 45%, transparent)",
    borderColor: "color-mix(in srgb, var(--ctp-teal) 65%, transparent)",
  },
  finished: {
    backgroundColor: "color-mix(in srgb, var(--ctp-green) 45%, transparent)",
    borderColor: "color-mix(in srgb, var(--ctp-green) 65%, transparent)",
  },
  dropped: {
    backgroundColor: "color-mix(in srgb, var(--ctp-red) 35%, transparent)",
    borderColor: "color-mix(in srgb, var(--ctp-red) 55%, transparent)",
  },
  completed: {
    backgroundColor: "color-mix(in srgb, var(--ctp-green) 45%, transparent)",
    borderColor: "color-mix(in srgb, var(--ctp-green) 65%, transparent)",
  },
};

const FRANCHISE_STYLE: CSSProperties = {
  backgroundColor: "color-mix(in srgb, var(--ctp-mauve) 45%, transparent)",
  borderColor: "color-mix(in srgb, var(--ctp-mauve) 65%, transparent)",
};

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
}: GameCardProps) {
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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavoriteMutation.mutate(!isFavorite);
  };

  return (
    <Link
      to="/library/$id"
      params={{ id }}
      className="rounded-xl border border-ctp-surface1 bg-ctp-surface0/40 hover:border-ctp-mauve transition-all cursor-pointer group relative p-0 sm:p-4"
    >
      {/* Mobile: Poster-only layout with overlay */}
      <div className="sm:hidden relative aspect-[3/4] overflow-hidden rounded-lg">
        {coverArtUrl ? (
          <img src={coverArtUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
            <span className="text-zinc-600 text-sm">No image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ctp-base/70 via-ctp-base/20 to-transparent dark:from-ctp-crust/80 dark:via-transparent dark:to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 bg-ctp-base/60 p-2">
          <div className="flex gap-1 mb-1">
            <PlatformIcons platforms={platforms} size="xs" maxDisplay={5} />
          </div>
          <h3 className="text-sm font-bold text-ctp-text line-clamp-2 group-hover:text-ctp-mauve transition-colors">
            {name}
          </h3>
        </div>
        <Button
          onClick={handleFavoriteClick}
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 text-ctp-red hover:scale-110 transition-transform"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <svg
            className="w-5 h-5"
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
      <div className="hidden sm:flex gap-4">
        <div className="relative shrink-0">
          {coverArtUrl ? (
            <img src={coverArtUrl} alt={name} className="w-24 h-32 object-cover rounded" />
          ) : (
            <div className="w-24 h-32 bg-zinc-800 rounded flex items-center justify-center">
              <span className="text-zinc-600 text-xs">No image</span>
            </div>
          )}
          <Button
            onClick={handleFavoriteClick}
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 z-10 text-ctp-red hover:scale-110 transition-transform"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <svg
              className="w-5 h-5"
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

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold mb-2 group-hover:text-ctp-mauve transition-colors break-words">
            {name}
          </h3>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <PlatformIcons platforms={platforms} size="sm" maxDisplay={5} />
            <Badge
              className="border text-ctp-text"
              style={STATUS_STYLES[status as keyof typeof STATUS_STYLES]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
            {seriesName && (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate({ to: "/franchises/$seriesName", params: { seriesName } });
                }}
                variant="ghost"
                className="inline-flex h-auto items-center rounded border px-2 py-1 text-xs font-medium text-ctp-text hover:opacity-90 transition-colors"
                style={FRANCHISE_STYLE}
              >
                {seriesName}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-zinc-400 flex-wrap">
            {metacriticScore && (
              <div className="flex items-center gap-1">
                <span className="text-ctp-yellow">Metacritic:</span>
                <span>{metacriticScore}</span>
              </div>
            )}

            {userRating && (
              <div className="flex items-center gap-1">
                <span className="text-ctp-teal">Your rating:</span>
                <span>{userRating}/10</span>
              </div>
            )}

            {totalMinutes > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-zinc-500">Time:</span>
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
