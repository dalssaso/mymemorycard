import { Link } from '@tanstack/react-router'

interface GameCardProps {
  id: string
  name: string
  cover_art_url: string | null
  platform_display_name: string
  status: string
  metacritic_score: number | null
  user_rating: number | null
  total_minutes: number
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
  platform_display_name,
  status,
  metacritic_score,
  user_rating,
  total_minutes,
}: GameCardProps) {
  const hours = Math.floor(total_minutes / 60)
  const minutes = total_minutes % 60

  return (
    <Link
      to="/library/$id"
      params={{ id }}
      className="card hover:border-primary-purple transition-all cursor-pointer group"
    >
      <div className="flex gap-4">
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

        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2 group-hover:text-primary-purple transition-colors">
            {name}
          </h3>

          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-steam">{platform_display_name}</span>
            <span className={`badge ${STATUS_COLORS[status as keyof typeof STATUS_COLORS]}`}>
              {status}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-zinc-400">
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
        </div>
      </div>
    </Link>
  )
}
