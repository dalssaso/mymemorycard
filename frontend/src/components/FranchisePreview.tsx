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
    return <div className="bg-ctp-surface1 h-24 animate-pulse rounded-lg" />;
  }

  if (!data || data.owned_games.length === 0) {
    return null;
  }

  const displayGames = data.owned_games.slice(0, 5);

  return (
    <div className="bg-ctp-surface0/50 border-ctp-surface1 rounded-lg border p-3">
      <div className="text-ctp-text mb-2 text-sm font-medium">{seriesName}</div>

      <ScrollFade axis="x" className="flex gap-2 overflow-x-auto pb-2">
        {displayGames.map((game: OwnedGame) => (
          <Link
            key={game.id}
            to="/library/$id"
            params={{ id: game.id }}
            className={`group shrink-0 ${game.id === currentGameId ? "ring-ctp-mauve rounded ring-2" : ""}`}
          >
            {game.cover_art_url ? (
              <img
                src={game.cover_art_url}
                alt={game.name}
                title={game.name}
                className="group-hover:ring-ctp-teal h-16 w-12 rounded object-cover transition-all group-hover:ring-2"
              />
            ) : (
              <div
                className="bg-ctp-surface1 text-ctp-overlay1 group-hover:ring-ctp-teal flex h-16 w-12 items-center justify-center rounded text-xs transition-all group-hover:ring-2"
                title={game.name}
              >
                ?
              </div>
            )}
          </Link>
        ))}
        {data.owned_games.length > 5 && (
          <div className="bg-ctp-surface1 text-ctp-subtext0 flex h-16 w-12 shrink-0 items-center justify-center rounded text-xs">
            +{data.owned_games.length - 5}
          </div>
        )}
      </ScrollFade>

      <div className="border-ctp-surface1 mt-2 flex items-center justify-between border-t pt-2">
        <Link
          to="/franchises/$seriesName"
          params={{ seriesName }}
          className="text-ctp-mauve hover:text-ctp-teal text-xs transition-colors"
        >
          View franchise
        </Link>
        <span className="text-ctp-overlay1 text-xs">
          {data.owned_games.length} owned
          {data.missing_games.length > 0 && ` · ${data.missing_games.length} missing`}
        </span>
      </div>
    </div>
  );
}
