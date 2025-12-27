import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { gamesAPI } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AddToCollection } from './AddToCollection'
import { PlatformIcons } from './PlatformIcon'

interface GameCardProps {
  id: string
  name: string
  cover_art_url: string | null
  platforms: { id: string; name: string; displayName: string }[]
  status: string
  metacritic_score: number | null
  user_rating: number | null
  total_minutes: number
  is_favorite: boolean
}

const STATUS_COLORS = {
  backlog: 'text-status-backlog border-status-backlog',
  playing: 'text-status-playing border-status-playing',
  finished: 'text-status-finished border-status-finished',
  dropped: 'text-status-dropped border-status-dropped',
  completed: 'text-status-completed border-status-completed',
}

export function GameCard({
  id,
  name,
  cover_art_url,
  platforms,
  status,
  metacritic_score,
  user_rating,
  total_minutes,
  is_favorite,
}: GameCardProps) {
  const hours = Math.floor(total_minutes / 60)
  const minutes = total_minutes % 60
  const queryClient = useQueryClient()
  const [isFavorite, setIsFavorite] = useState(is_favorite)

  const toggleFavoriteMutation = useMutation({
    mutationFn: (newFavorite: boolean) => 
      gamesAPI.toggleFavorite(id, platforms[0]?.id || '', newFavorite),
    onMutate: async (newFavorite) => {
      setIsFavorite(newFavorite)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
    onError: () => {
      setIsFavorite(!isFavorite)
    }
  })

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavoriteMutation.mutate(!isFavorite)
  }

  return (
    <Link
      to="/library/$id"
      params={{ id }}
      className="card hover:border-primary-purple transition-all cursor-pointer group relative p-0 sm:p-4"
    >
      {/* Mobile: Poster-only layout with overlay */}
      <div className="sm:hidden relative aspect-[3/4] overflow-hidden rounded-lg">
        {cover_art_url ? (
          <img
            src={cover_art_url}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
            <span className="text-zinc-600 text-sm">No image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-primary-purple transition-colors">
            {name}
          </h3>
        </div>
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 z-10 text-xl hover:scale-110 transition-transform"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Desktop: Full card layout */}
      <div className="hidden sm:flex gap-4">
        <div className="relative shrink-0">
          {cover_art_url ? (
            <img
              src={cover_art_url}
              alt={name}
              className="w-24 h-32 object-cover rounded"
            />
          ) : (
            <div className="w-24 h-32 bg-zinc-800 rounded flex items-center justify-center">
              <span className="text-zinc-600 text-xs">No image</span>
            </div>
          )}
          <button
            onClick={handleFavoriteClick}
            className="absolute -top-2 -right-2 z-10 text-xl hover:scale-110 transition-transform"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold mb-2 group-hover:text-primary-purple transition-colors break-words">
            {name}
          </h3>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <PlatformIcons platforms={platforms.map(p => p.displayName)} size="sm" />
            <span className={`badge ${STATUS_COLORS[status as keyof typeof STATUS_COLORS]}`}>
              {status}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-zinc-400 flex-wrap">
            {metacritic_score && (
              <div className="flex items-center gap-1">
                <span className="text-primary-yellow">★</span>
                <span>{metacritic_score}</span>
              </div>
            )}

            {user_rating && (
              <div className="flex items-center gap-1">
                <span className="text-primary-cyan">Your rating:</span>
                <span>{user_rating}/10</span>
              </div>
            )}

            {total_minutes > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-zinc-500">⏱</span>
                <span>
                  {hours > 0 && `${hours}h `}
                  {minutes}m
                </span>
              </div>
            )}
          </div>

          <div className="mt-3" onClick={(e) => e.preventDefault()}>
            <AddToCollection gameId={id} />
          </div>
        </div>
      </div>
    </Link>
  )
}
