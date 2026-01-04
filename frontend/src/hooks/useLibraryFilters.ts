import { useCallback, useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { LibrarySearchParams } from "@/routes/library.index";

export interface LibraryFilters {
  platform: string;
  status: string;
  favorites: boolean;
  genre: string[];
  collection: string[];
  franchise: string[];
  sort: string;
}

export interface UseLibraryFiltersResult {
  filters: LibraryFilters;
  setFilter: <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  hasActiveFilters: boolean;
}

export function useLibraryFilters(): UseLibraryFiltersResult {
  const navigate = useNavigate({ from: "/library" });
  const searchParams = useSearch({ from: "/library" }) as LibrarySearchParams;

  const filters: LibraryFilters = useMemo(
    () => ({
      platform: searchParams.platform || "",
      status: searchParams.status || "",
      favorites: searchParams.favorites || false,
      genre: searchParams.genre
        ? Array.isArray(searchParams.genre)
          ? searchParams.genre
          : [searchParams.genre]
        : [],
      collection: searchParams.collection
        ? Array.isArray(searchParams.collection)
          ? searchParams.collection
          : [searchParams.collection]
        : [],
      franchise: searchParams.franchise
        ? Array.isArray(searchParams.franchise)
          ? searchParams.franchise
          : [searchParams.franchise]
        : [],
      sort: searchParams.sort || "",
    }),
    [searchParams]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.platform) count++;
    if (filters.status) count++;
    if (filters.favorites) count++;
    if (filters.genre.length > 0) count += filters.genre.length;
    if (filters.collection.length > 0) count += filters.collection.length;
    if (filters.franchise.length > 0) count += filters.franchise.length;
    // Note: sort is excluded from filter count as it's not semantically a filter
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  const setFilter = useCallback(
    <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => {
      navigate({
        search: (prev) => ({
          ...prev,
          [key]: Array.isArray(value) ? (value.length > 0 ? value : undefined) : value || undefined,
        }),
      });
    },
    [navigate]
  );

  const clearFilters = useCallback(() => {
    navigate({
      search: {},
    });
  }, [navigate]);

  return {
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
    hasActiveFilters,
  };
}
