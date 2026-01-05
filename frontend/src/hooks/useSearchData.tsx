import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collectionsAPI, franchisesAPI, gamesAPI, userPlatformsAPI } from "@/lib/api";

interface GameFromAPI {
  id: string;
  name: string;
  cover_art_url: string | null;
  platform_id: string;
  platform_display_name: string;
}

interface CollectionFromAPI {
  id: string;
  name: string;
  description: string | null;
  game_count: number;
  cover_art_url: string | null;
}

interface FranchiseFromAPI {
  series_name: string;
  game_count: number;
  cover_art_url: string | null;
}

interface UserPlatformFromAPI {
  id: string;
  name: string;
  display_name: string;
  platform_type: string;
  icon_url: string | null;
  default_icon_url: string | null;
  color_primary: string;
}

export interface SearchItem {
  id: string;
  name: string;
  href: string;
  subtitle?: string;
  type: "game" | "collection" | "franchise" | "platform";
  imageUrl?: string | null;
}

export interface SearchSection {
  label: string;
  items: SearchItem[];
}

interface SearchDataResult {
  sections: SearchSection[];
  totalCount: number;
}

interface SearchIndex {
  games: GameFromAPI[];
  collections: CollectionFromAPI[];
  franchises: FranchiseFromAPI[];
  platforms: UserPlatformFromAPI[];
}

const SEARCH_INDEX_STALE_TIME = 1000 * 60 * 5;

async function fetchSearchIndex(): Promise<SearchIndex> {
  const [gamesResponse, collectionsResponse, franchisesResponse, platformsResponse] =
    await Promise.all([
      gamesAPI.getAll(),
      collectionsAPI.getAll(),
      franchisesAPI.getAll(),
      userPlatformsAPI.getAll(),
    ]);

  return {
    games: (gamesResponse.data as { games: GameFromAPI[] }).games ?? [],
    collections:
      (collectionsResponse.data as { collections: CollectionFromAPI[] }).collections ?? [],
    franchises: (franchisesResponse.data as { franchises: FranchiseFromAPI[] }).franchises ?? [],
    platforms: (platformsResponse.data as { platforms: UserPlatformFromAPI[] }).platforms ?? [],
  };
}

function buildSearchResults(index: SearchIndex, query: string): SearchDataResult {
  if (!query) {
    return { sections: [], totalCount: 0 };
  }

  const aggregatedGames = new Map<string, GameFromAPI>();
  for (const game of index.games) {
    if (!aggregatedGames.has(game.id)) {
      aggregatedGames.set(game.id, game);
    }
  }

  const gameItems: SearchItem[] = Array.from(aggregatedGames.values())
    .filter((game) => game.name.toLowerCase().includes(query))
    .slice(0, 6)
    .map((game) => ({
      id: game.id,
      name: game.name,
      href: `/library/${game.id}`,
      subtitle: game.platform_display_name,
      type: "game",
      imageUrl: game.cover_art_url,
    }));

  const collectionItems: SearchItem[] = index.collections
    .filter((collection) => collection.name.toLowerCase().includes(query))
    .slice(0, 6)
    .map((collection) => ({
      id: collection.id,
      name: collection.name,
      href: `/collections/${collection.id}`,
      subtitle: `${collection.game_count} games`,
      type: "collection",
      imageUrl: collection.cover_art_url,
    }));

  const franchiseItems: SearchItem[] = index.franchises
    .filter((franchise) => franchise.series_name.toLowerCase().includes(query))
    .slice(0, 6)
    .map((franchise) => ({
      id: franchise.series_name,
      name: franchise.series_name,
      href: `/franchises/${encodeURIComponent(franchise.series_name)}`,
      subtitle: `${franchise.game_count} games`,
      type: "franchise",
      imageUrl: franchise.cover_art_url,
    }));

  const platformItems: SearchItem[] = index.platforms
    .filter((platform) => platform.display_name.toLowerCase().includes(query))
    .slice(0, 6)
    .map((platform) => ({
      id: platform.id,
      name: platform.display_name,
      href: `/platforms/${platform.id}`,
      subtitle: platform.platform_type,
      type: "platform",
      imageUrl: platform.icon_url ?? platform.default_icon_url,
    }));

  const sections: SearchSection[] = [];
  if (gameItems.length) sections.push({ label: "Games", items: gameItems });
  if (collectionItems.length) sections.push({ label: "Collections", items: collectionItems });
  if (franchiseItems.length) sections.push({ label: "Franchises", items: franchiseItems });
  if (platformItems.length) sections.push({ label: "Platforms", items: platformItems });

  const totalCount = sections.reduce((total, section) => total + section.items.length, 0);
  return { sections, totalCount };
}

export function useSearchData(searchQuery: string): SearchDataResult {
  const queryClient = useQueryClient();
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const { data } = useQuery({
    queryKey: ["search-results", normalizedQuery],
    queryFn: async () => {
      if (!normalizedQuery) {
        return { sections: [], totalCount: 0 };
      }

      const index = await queryClient.fetchQuery({
        queryKey: ["search-index"],
        queryFn: fetchSearchIndex,
        staleTime: SEARCH_INDEX_STALE_TIME,
      });

      return buildSearchResults(index, normalizedQuery);
    },
    enabled: normalizedQuery.length > 0,
  });

  return data ?? { sections: [], totalCount: 0 };
}
