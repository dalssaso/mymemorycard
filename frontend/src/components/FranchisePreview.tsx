import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ScrollFade } from "@/components/ui";
import { franchisesAPI, type OwnedGame } from "@/lib/api";

interface FranchisePreviewProps {
  seriesName: string;
  currentGameId: string;
}

export function FranchisePreview({ seriesName, currentGameId }: FranchisePreviewProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["franchise", seriesName],
    queryFn: async () => {
      const response = await franchisesAPI.getOne(seriesName);
      return response.data;
    },
    enabled: !!seriesName,
  });

  if (isLoading) {
    return <div className="animate-pulse h-24 bg-ctp-surface1 rounded-lg" />;
  }

  if (!data || data.owned_games.length === 0) {
    return null;
  }

  const displayGames = data.owned_games.slice(0, 5);

  return (
    <div className="bg-ctp-surface0/50 border border-ctp-surface1 rounded-lg p-3">
      <div className="text-sm font-medium text-ctp-text mb-2">{seriesName}</div>

      <ScrollFade axis="x" className="flex gap-2 overflow-x-auto pb-2">
        {displayGames.map((game: OwnedGame) => (
          <Link
            key={game.id}
            to="/library/$id"
            params={{ id: game.id }}
            className={`shrink-0 group ${game.id === currentGameId ? "ring-2 ring-ctp-mauve rounded" : ""}`}
          >
            {game.cover_art_url ? (
              <img
                src={game.cover_art_url}
                alt={game.name}
                title={game.name}
                className="w-12 h-16 object-cover rounded group-hover:ring-2 group-hover:ring-ctp-teal transition-all"
              />
            ) : (
              <div
                className="w-12 h-16 bg-ctp-surface1 rounded flex items-center justify-center text-ctp-overlay1 text-xs group-hover:ring-2 group-hover:ring-ctp-teal transition-all"
                title={game.name}
              >
                ?
              </div>
            )}
          </Link>
        ))}
        {data.owned_games.length > 5 && (
          <div className="shrink-0 w-12 h-16 bg-ctp-surface1 rounded flex items-center justify-center text-ctp-subtext0 text-xs">
            +{data.owned_games.length - 5}
          </div>
        )}
      </ScrollFade>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-ctp-surface1">
        <Link
          to="/franchises/$seriesName"
          params={{ seriesName }}
          className="text-xs text-ctp-mauve hover:text-ctp-teal transition-colors"
        >
          View franchise
        </Link>
        <span className="text-xs text-ctp-overlay1">
          {data.owned_games.length} owned
          {data.missing_games.length > 0 && ` · ${data.missing_games.length} missing`}
        </span>
      </div>
    </div>
  );
}
