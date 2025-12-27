import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { franchisesAPI, OwnedGame } from '@/lib/api'

interface FranchisePreviewProps {
  seriesName: string
  currentGameId: string
}

export function FranchisePreview({ seriesName, currentGameId }: FranchisePreviewProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['franchise', seriesName],
    queryFn: async () => {
      const response = await franchisesAPI.getOne(seriesName)
      return response.data
    },
    enabled: !!seriesName,
  })

  if (isLoading) {
    return (
      <div className="animate-pulse h-24 bg-gray-700 rounded-lg" />
    )
  }

  if (!data || data.owned_games.length === 0) {
    return null
  }

  const displayGames = data.owned_games.slice(0, 5)

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
      <div className="text-sm font-medium text-white mb-2">{seriesName}</div>
      
      <div className="flex gap-2 overflow-x-auto pb-2">
        {displayGames.map((game: OwnedGame) => (
          <Link
            key={game.id}
            to="/library/$id"
            params={{ id: game.id }}
            className={`shrink-0 group ${game.id === currentGameId ? 'ring-2 ring-primary-purple rounded' : ''}`}
          >
            {game.cover_art_url ? (
              <img
                src={game.cover_art_url}
                alt={game.name}
                title={game.name}
                className="w-12 h-16 object-cover rounded group-hover:ring-2 group-hover:ring-primary-cyan transition-all"
              />
            ) : (
              <div 
                className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center text-gray-500 text-xs group-hover:ring-2 group-hover:ring-primary-cyan transition-all"
                title={game.name}
              >
                ?
              </div>
            )}
          </Link>
        ))}
        {data.owned_games.length > 5 && (
          <div className="shrink-0 w-12 h-16 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">
            +{data.owned_games.length - 5}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
        <Link
          to="/franchises/$seriesName"
          params={{ seriesName }}
          className="text-xs text-primary-purple hover:text-primary-cyan transition-colors"
        >
          View franchise
        </Link>
        <span className="text-xs text-gray-500">
          {data.owned_games.length} owned{data.missing_games.length > 0 && ` · ${data.missing_games.length} missing`}
        </span>
      </div>
    </div>
  )
}
