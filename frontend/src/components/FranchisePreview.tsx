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
    return <div className="h-24 animate-pulse rounded-lg bg-ctp-surface1" />;
  }

  if (!data || data.owned_games.length === 0) {
    return null;
  }

  const displayGames = data.owned_games.slice(0, 5);

  return (
    <div className="bg-ctp-surface0/50 rounded-lg border border-ctp-surface1 p-3">
      <div className="mb-2 text-sm font-medium text-ctp-text">{seriesName}</div>

      <ScrollFade axis="x" className="flex gap-2 overflow-x-auto pb-2">
        {displayGames.map((game: OwnedGame) => (
          <Link
            key={game.id}
            to="/library/$id"
            params={{ id: game.id }}
            className={`group shrink-0 ${game.id === currentGameId ? "rounded ring-2 ring-ctp-mauve" : ""}`}
          >
            {game.cover_art_url ? (
              <img
                src={game.cover_art_url}
                alt={game.name}
                title={game.name}
                className="h-16 w-12 rounded object-cover transition-all group-hover:ring-2 group-hover:ring-ctp-teal"
              />
            ) : (
              <div
                className="flex h-16 w-12 items-center justify-center rounded bg-ctp-surface1 text-xs text-ctp-overlay1 transition-all group-hover:ring-2 group-hover:ring-ctp-teal"
                title={game.name}
              >
                ?
              </div>
            )}
          </Link>
        ))}
        {data.owned_games.length > 5 && (
          <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded bg-ctp-surface1 text-xs text-ctp-subtext0">
            +{data.owned_games.length - 5}
          </div>
        )}
      </ScrollFade>

      <div className="mt-2 flex items-center justify-between border-t border-ctp-surface1 pt-2">
        <Link
          to="/franchises/$seriesName"
          params={{ seriesName }}
          className="text-xs text-ctp-mauve transition-colors hover:text-ctp-teal"
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
