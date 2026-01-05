import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { collectionsAPI, gamesAPI } from "@/lib/api";

const Library = lazyRouteComponent(() =>
  import("@/pages/Library").then((module) => ({ default: module.Library }))
);

export interface LibrarySearchParams {
  status?: string;
  platform?: string;
  genre?: string;
  collection?: string;
  franchise?: string;
  favorites?: boolean;
  sort?: string;
}

export const Route = createFileRoute("/library/")({
  component: Library,
  validateSearch: (search: Record<string, unknown>): LibrarySearchParams => {
    return {
      status: search.status as string | undefined,
      platform: search.platform as string | undefined,
      genre: search.genre as string | undefined,
      collection: search.collection as string | undefined,
      franchise: search.franchise as string | undefined,
      favorites: search.favorites === true || search.favorites === "true",
      sort: search.sort as string | undefined,
    };
  },
  loader: async ({ context, location }) => {
    const search = location.search as LibrarySearchParams;
    const filters = {
      platform: search.platform || "",
      status: search.status || "",
      favorites: search.favorites || false,
      genre: search.genre ? (Array.isArray(search.genre) ? search.genre : [search.genre]) : [],
      collection: search.collection
        ? Array.isArray(search.collection)
          ? search.collection
          : [search.collection]
        : [],
      franchise: search.franchise
        ? Array.isArray(search.franchise)
          ? search.franchise
          : [search.franchise]
        : [],
      sort: search.sort || "",
    };

    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["games", filters],
        queryFn: async () => {
          const response = await gamesAPI.getAll({
            platform: filters.platform || undefined,
            status: filters.status || undefined,
            favorites: filters.favorites || undefined,
            genre: filters.genre.length > 0 ? filters.genre.join(",") : undefined,
            collection: filters.collection.length > 0 ? filters.collection.join(",") : undefined,
            franchise: filters.franchise.length > 0 ? filters.franchise.join(",") : undefined,
            sort: filters.sort || undefined,
          });
          return response.data;
        },
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["collections"],
        queryFn: async () => {
          const response = await collectionsAPI.getAll();
          return response.data;
        },
      }),
    ]);
  },
});
