import { createFileRoute } from "@tanstack/react-router";
import { Library } from "@/pages/Library";

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
});
