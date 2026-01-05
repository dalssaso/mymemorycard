import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "@tanstack/react-router";
import { BackButton, PageLayout } from "@/components/layout";
import { Card } from "@/components/ui";
import { collectionsAPI } from "@/lib/api";

interface Game {
  id: string;
  name: string;
  cover_art_url: string | null;
  platform_display_name: string;
  status: string;
  user_rating: number | null;
  is_favorite: boolean;
  release_date: string | null;
}

export function SeriesDetail() {
  const { seriesName } = useParams({ from: "/collections/series/$seriesName" });

  const { data, isLoading } = useQuery({
    queryKey: ["series", seriesName],
    queryFn: async () => {
      const response = await collectionsAPI.getSeriesGames(seriesName);
      return response.data as { series_name: string; games: Game[] };
    },
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-ctp-subtext0">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (!data) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-ctp-red">Series not found</div>
        </div>
      </PageLayout>
    );
  }

  const { games } = data;

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/collections"
            className="mb-4 hidden text-ctp-teal transition-colors hover:text-ctp-mauve md:inline-block"
          >
            Back to Collections
          </Link>
          <div className="mb-2 flex items-center gap-3">
            <BackButton
              iconOnly={true}
              className="rounded-lg p-2 text-ctp-subtext0 transition-all hover:bg-ctp-surface0 hover:text-ctp-text md:hidden"
            />
            <h1 className="text-4xl font-bold text-ctp-text">{seriesName} Series</h1>
          </div>
          <p className="text-sm text-ctp-teal">
            {games.length} {games.length === 1 ? "game" : "games"}
          </p>
        </div>

        {/* Games Grid */}
        {games.length === 0 ? (
          <Card>
            <p className="py-8 text-center text-ctp-subtext0">No games found in this series.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {games.map((game) => (
              <Link key={game.id} to="/library/$id" params={{ id: game.id }} className="group">
                <div className="relative mb-2 aspect-[3/4] overflow-hidden rounded-lg bg-ctp-surface0">
                  {game.cover_art_url ? (
                    <img
                      src={game.cover_art_url}
                      alt={game.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ctp-overlay1">
                      No Cover
                    </div>
                  )}
                  {game.is_favorite && (
                    <div className="absolute right-2 top-2 text-ctp-red">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="mb-1 truncate text-sm text-ctp-subtext1 group-hover:text-ctp-text">
                  {game.name}
                </p>
                {game.release_date && (
                  <p className="text-xs text-ctp-overlay1">
                    {new Date(game.release_date).getFullYear()}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
