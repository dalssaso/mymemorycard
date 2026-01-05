import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useLibraryFilters } from "@/hooks/useLibraryFilters";
import { useCollections } from "@/hooks/useCollections";
import { useGames } from "@/hooks/useGames";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { GameCard } from "@/components/GameCard";
import { BackButton, PageLayout } from "@/components/layout";
import { LibrarySidebar } from "@/components/sidebar";
import { PlatformIcons } from "@/components/PlatformIcon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SkeletonCard,
  Input,
  ScrollFade,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { collectionsAPI, gamesAPI } from "@/lib/api";
import { SortControl, ActiveFilterPills } from "@/components/filters";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  game_count: number;
}

interface Game {
  id: string;
  name: string;
  cover_art_url: string | null;
  platforms: {
    id: string;
    name: string;
    displayName: string;
    iconUrl: string | null;
    colorPrimary: string;
  }[];
  status: string;
  max_user_rating: number | null;
  total_minutes_sum: number;
  latest_last_played: string | null;
  metacritic_score: number | null;
  release_date: string | null;
  is_favorite_any: boolean;
  series_name: string | null;
}

interface AggregatedGame {
  id: string;
  name: string;
  cover_art_url: string | null;
  platforms: {
    id: string;
    name: string;
    displayName: string;
    iconUrl: string | null;
    colorPrimary: string;
  }[];
  status: string;
  user_rating: number | null;
  total_minutes: number;
  last_played: string | null;
  metacritic_score: number | null;
  release_date: string | null;
  is_favorite: boolean;
  series_name: string | null;
}

const columnHelper = createColumnHelper<AggregatedGame>();

const COLUMN_LABELS: Record<string, string> = {
  name: "Name",
  platforms: "Platforms",
  status: "Status",
  metacritic_score: "Critic Score",
  user_rating: "Your Rating",
  total_minutes: "Playtime",
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function Library() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { filters, setFilter, clearFilters, hasActiveFilters } = useLibraryFilters();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showColumnSettings, setShowColumnSettings] = useState<boolean>(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  const handleExitSelectionMode = () => {
    setSelectionMode(false);
    setRowSelection({});
    setShowCollectionDropdown(false);
  };

  const handleExport = async (format: "json" | "csv") => {
    try {
      const response = await gamesAPI.export(format);
      const blob = new Blob([response.data], {
        type: format === "json" ? "application/json" : "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mymemorycard-export-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast(`Library exported as ${format.toUpperCase()}`, "success");
    } catch {
      showToast("Failed to export library", "error");
    }
  };

  const { data, isLoading, error } = useGames(filters);
  const { data: collectionsData } = useCollections();

  const collections = (collectionsData?.collections as Collection[]) || [];

  const bulkDeleteMutation = useMutation({
    mutationFn: (gameIds: string[]) => gamesAPI.bulkDelete(gameIds),
    onMutate: async (gameIds) => {
      await queryClient.cancelQueries({ queryKey: ["games"] });
      const previousGames = queryClient.getQueriesData({ queryKey: ["games"] });

      queryClient.setQueriesData<{ games: Game[] }>({ queryKey: ["games"] }, (oldData) => {
        if (!oldData?.games) return oldData;
        return {
          ...oldData,
          games: oldData.games.filter((game) => !gameIds.includes(game.id)),
        };
      });

      return { previousGames };
    },
    onSuccess: (_, gameIds) => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      handleExitSelectionMode();
      showToast(`Deleted ${gameIds.length} game(s)`, "success");
      setShowDeleteConfirm(false);
    },
    onError: (_error, _variables, context) => {
      context?.previousGames?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      showToast("Failed to delete games", "error");
    },
  });

  const bulkAddToCollectionMutation = useMutation({
    mutationFn: ({ collectionId, gameIds }: { collectionId: string; gameIds: string[] }) =>
      collectionsAPI.bulkAddGames(collectionId, gameIds),
    onMutate: async ({ collectionId, gameIds }) => {
      await queryClient.cancelQueries({ queryKey: ["collections"] });
      const previousCollections = queryClient.getQueriesData({ queryKey: ["collections"] });

      queryClient.setQueriesData<{ collections: Collection[] }>(
        { queryKey: ["collections"] },
        (oldData) => {
          if (!oldData?.collections) return oldData;
        return {
          ...oldData,
          collections: oldData.collections.map((collection: Collection) =>
            collection.id === collectionId
              ? { ...collection, game_count: collection.game_count + gameIds.length }
              : collection
          ),
        };
        }
      );

      return { previousCollections };
    },
    onSuccess: (_, { gameIds }) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      handleExitSelectionMode();
      showToast(`Added ${gameIds.length} game(s) to collection`, "success");
    },
    onError: (_error, _variables, context) => {
      context?.previousCollections?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      showToast("Failed to add games to collection", "error");
    },
  });

  const games = useMemo(() => (data?.games as Game[]) ?? [], [data?.games]);

  // Backend now returns aggregated games, use directly
  const aggregatedGames = useMemo(() => {
    return games.map((game) => ({
      id: game.id,
      name: game.name,
      cover_art_url: game.cover_art_url,
      platforms: game.platforms,
      status: game.status,
      user_rating: game.max_user_rating,
      total_minutes: game.total_minutes_sum,
      last_played: game.latest_last_played,
      metacritic_score: game.metacritic_score,
      release_date: game.release_date,
      is_favorite: game.is_favorite_any,
      series_name: game.series_name,
    }));
  }, [games]);

  // Get unique platforms and statuses for filters
  const uniquePlatforms = useMemo(() => {
    const platformsSet = new Set<string>();
    aggregatedGames.forEach((game) => {
      game.platforms.forEach((p) => platformsSet.add(p.displayName));
    });
    return Array.from(platformsSet).sort();
  }, [aggregatedGames]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(aggregatedGames.map((g) => g.status));
    return Array.from(statuses).sort();
  }, [aggregatedGames]);

  // Backend handles filtering and sorting, use aggregated games directly
  const filteredGames = aggregatedGames;

  const selectedGameIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => filteredGames[parseInt(index)]?.id)
      .filter(Boolean) as string[];
  }, [rowSelection, filteredGames]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => (
          <div className="flex items-center gap-3">
            {info.row.original.cover_art_url ? (
              <img
                src={info.row.original.cover_art_url}
                alt={info.getValue()}
                className="w-8 h-12 object-cover rounded"
              />
            ) : (
              <div className="w-8 h-12 bg-zinc-800 rounded flex items-center justify-center">
                <span className="text-zinc-600 text-xs">No image</span>
              </div>
            )}
            <Link
              to="/library/$id"
              params={{ id: info.row.original.id }}
              className="text-blue-400 hover:text-blue-300"
            >
              {info.getValue()}
            </Link>
          </div>
        ),
      }),
      columnHelper.accessor("platforms", {
        header: "Platforms",
        cell: (info) => <PlatformIcons platforms={info.getValue()} size="sm" maxDisplay={5} />,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("metacritic_score", {
        header: "Score",
        cell: (info) => info.getValue() || "-",
      }),
      columnHelper.accessor("user_rating", {
        header: "Rating",
        cell: (info) => (info.getValue() ? `${info.getValue()}/10` : "-"),
      }),
      columnHelper.accessor("total_minutes", {
        header: "Playtime",
        cell: (info) => {
          const minutes = info.getValue();
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filteredGames,
    columns,
    state: {
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    enableSorting: false,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  const allFilteredSelected = filteredGames.length > 0 && table.getIsAllRowsSelected();

  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <BackButton
              iconOnly={true}
              className="md:hidden p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
            />
            <h1 className="text-4xl font-bold text-ctp-text">Library</h1>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md p-6">
            <h2 className="text-2xl font-bold text-ctp-red mb-4">Error</h2>
            <p className="text-zinc-400">Failed to load your library. Please try again.</p>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const handleClearFilters = () => {
    setGlobalFilter("");
    clearFilters();
  };

  const sidebarContent = (
    <LibrarySidebar
      filters={filters}
      setFilter={setFilter}
      viewMode={viewMode}
      setViewMode={setViewMode}
      uniquePlatforms={uniquePlatforms}
      uniqueStatuses={uniqueStatuses}
      collections={collections}
      onClearFilters={handleClearFilters}
      hasActiveFilters={hasActiveFilters || Boolean(globalFilter)}
    />
  );

  return (
    <PageLayout sidebar={sidebarContent} customCollapsed={true}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <BackButton
              iconOnly={true}
              className="md:hidden p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
            />
            <h1 className="text-4xl font-bold text-ctp-mauve">Library</h1>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleExport("json")}
              className="border-ctp-teal/30 bg-ctp-teal/20 text-ctp-teal hover:bg-ctp-teal/30"
            >
              Export JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("csv")}
              className="border-ctp-green/30 bg-ctp-green/20 text-ctp-green hover:bg-ctp-green/30"
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Search and Column Settings */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <Input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search games..."
            aria-label="Search games in your library"
            className="min-w-[200px] flex-1"
          />

          {/* Column Visibility (Table View Only) */}
          {viewMode === "table" && (
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="border-ctp-surface1 bg-ctp-surface0/50 text-sm text-ctp-subtext1 hover:border-ctp-mauve"
                aria-expanded={showColumnSettings}
                aria-controls="column-settings"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
                Columns
              </Button>
              {showColumnSettings && (
                <div
                  id="column-settings"
                  className="absolute top-full left-0 mt-2 p-3 bg-ctp-mantle border border-ctp-surface1 rounded-lg shadow-lg z-10 min-w-[200px]"
                >
                  <div className="flex flex-col gap-2">
                    {table.getAllLeafColumns().map((column) => (
                      <label
                        key={column.id}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:text-ctp-text"
                      >
                        <Checkbox
                          checked={column.getIsVisible()}
                          onCheckedChange={(checked) =>
                            column.toggleVisibility(checked === true)
                          }
                        />
                        <span className="text-zinc-300">
                          {COLUMN_LABELS[column.id] ?? column.id}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active Filter Pills */}
        {hasActiveFilters && (
          <div className="mb-4">
            <ActiveFilterPills
              filters={filters}
              setFilter={setFilter}
              onClearAll={handleClearFilters}
            />
          </div>
        )}

        {/* Results count, page size, and selection toggle */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">
              {(() => {
                const { pageIndex, pageSize } = table.getState().pagination;
                const start = pageIndex * pageSize + 1;
                const end = Math.min((pageIndex + 1) * pageSize, filteredGames.length);
                return `Showing ${start}-${end} of ${filteredGames.length} games`;
              })()}
              {hasActiveFilters && ` (filtered from ${games.length} total)`}
            </span>
            {!selectionMode && games.length > 0 && (
              <>
                <SortControl
                  currentSort={filters.sort}
                  onSortChange={(s) => setFilter("sort", s)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectionMode(true)}
                  className="h-auto border-zinc-700 text-sm text-zinc-400 hover:border-zinc-500 hover:text-ctp-text"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                  Select
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm text-zinc-400">
              Items per page:
            </label>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger id="pageSize" className="min-w-[90px] text-sm">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selection Mode Bar */}
        {selectionMode && (
          <div className="mb-4 p-3 bg-ctp-surface0/50 border border-ctp-surface1 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-ctp-text">
                {selectedGameIds.length > 0
                  ? `${selectedGameIds.length} game(s) selected`
                  : "Select games to manage"}
              </span>
              {filteredGames.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => table.toggleAllRowsSelected(!allFilteredSelected)}
                  className="h-auto px-2 text-sm text-zinc-400 hover:text-ctp-text hover:bg-transparent"
                >
                  {allFilteredSelected ? "Deselect all" : "Select all"}
                </Button>
              )}
              {selectedGameIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRowSelection({})}
                  className="h-auto px-2 text-sm text-zinc-400 hover:text-ctp-text hover:bg-transparent"
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedGameIds.length > 0 && (
                <>
                  {/* Add to Collection */}
                  <DropdownMenu
                    open={showCollectionDropdown}
                    onOpenChange={setShowCollectionDropdown}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-auto border-ctp-teal/30 bg-ctp-teal/20 text-ctp-teal hover:bg-ctp-teal/30"
                      >
                        Add to Collection
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="min-w-[200px] border-ctp-surface1 bg-ctp-mantle"
                    >
                      {collections.length === 0 ? (
                        <div className="px-2 py-1 text-sm text-zinc-400">
                          No collections yet
                        </div>
                      ) : (
                        collections.map((collection) => (
                          <DropdownMenuItem
                            key={collection.id}
                            onClick={() =>
                              bulkAddToCollectionMutation.mutate({
                                collectionId: collection.id,
                                gameIds: selectedGameIds,
                              })
                            }
                            disabled={bulkAddToCollectionMutation.isPending}
                          >
                            {collection.name}
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Delete */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="h-auto border-ctp-red/30 bg-ctp-red/20 text-ctp-red hover:bg-ctp-red/30"
                  >
                    Delete
                  </Button>
                </>
              )}

              {/* Cancel/Done */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExitSelectionMode}
                className="h-auto bg-zinc-700 text-ctp-text hover:bg-zinc-600"
              >
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="border-ctp-surface1 bg-ctp-mantle">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-ctp-text">
                Delete Games
              </AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                Are you sure you want to delete {selectedGameIds.length} game(s) from your
                library? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 flex flex-col gap-3 sm:flex-row">
              <AlertDialogCancel className="border-ctp-surface1 bg-ctp-surface1 text-ctp-text hover:bg-ctp-surface2">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => bulkDeleteMutation.mutate(selectedGameIds)}
                className="bg-ctp-red text-ctp-base hover:bg-ctp-red/90"
              >
                {bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {games.length === 0 ? (
          <Card className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-4">No Games Yet</h2>
            <p className="text-zinc-400 mb-6">Start building your library by importing games</p>
            <Button asChild>
              <Link to="/import">Import Games</Link>
            </Button>
          </Card>
        ) : viewMode === "grid" ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
              {table.getRowModel().rows.map((row) => {
                const isSelected = row.getIsSelected();
                if (selectionMode) {
                  return (
                    <div
                      key={row.original.id}
                      onClick={() => row.toggleSelected()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          row.toggleSelected();
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`rounded-xl border border-ctp-surface1 bg-ctp-surface0/40 cursor-pointer transition-all relative p-0 sm:p-4 ${
                        isSelected ? "bg-ctp-mauve/20 border-ctp-mauve" : "hover:border-zinc-500"
                      }`}
                    >
                      {/* Mobile: Poster-only layout */}
                      <div className="sm:hidden relative aspect-[3/4] overflow-hidden rounded-lg">
                        {row.original.cover_art_url ? (
                          <img
                            src={row.original.cover_art_url}
                            alt={row.original.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <span className="text-zinc-600 text-sm">No image</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-ctp-base/70 via-ctp-base/20 to-transparent dark:from-ctp-crust/80 dark:via-transparent dark:to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h3 className="text-sm font-bold text-ctp-text line-clamp-2">
                            {row.original.name}
                          </h3>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-ctp-mauve flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={3}
                              stroke="currentColor"
                              className="w-4 h-4 text-ctp-text"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m4.5 12.75 6 6 9-13.5"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Desktop: Full card layout */}
                      <div className="hidden sm:flex gap-4">
                        {row.original.cover_art_url ? (
                          <img
                            src={row.original.cover_art_url}
                            alt={row.original.name}
                            className="w-24 h-32 object-cover rounded"
                          />
                        ) : (
                          <div className="w-24 h-32 bg-zinc-800 rounded flex items-center justify-center">
                            <span className="text-zinc-600 text-xs">No image</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-2">{row.original.name}</h3>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <PlatformIcons
                              platforms={row.original.platforms}
                              size="sm"
                              maxDisplay={5}
                            />
                            <Badge className="border border-zinc-600 text-zinc-400">
                              {row.original.status.charAt(0).toUpperCase() +
                                row.original.status.slice(1)}
                            </Badge>
                          </div>
                          {row.original.metacritic_score && (
                            <div className="flex items-center gap-1 text-sm text-zinc-400">
                              <span className="text-ctp-yellow">★</span>
                              <span>{row.original.metacritic_score}</span>
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-ctp-mauve flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={3}
                              stroke="currentColor"
                              className="w-4 h-4 text-ctp-text"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m4.5 12.75 6 6 9-13.5"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return <GameCard key={row.original.id} {...row.original} />;
              })}
            </div>

            {table.getPageCount() > 1 && (
              <div className="flex justify-center items-center gap-4">
                <Button
                  variant="secondary"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <span className="text-zinc-400">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <Card className="p-0">
              <ScrollFade axis="x" className="overflow-x-auto">
                <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-zinc-700">
                      {selectionMode && (
                        <th className="w-12 p-4">
                          <Checkbox
                            checked={table.getIsAllPageRowsSelected()}
                            onChange={table.getToggleAllPageRowsSelectedHandler()}
                            className="cursor-pointer"
                          />
                        </th>
                      )}
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="text-left p-4 text-zinc-400 font-medium">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b border-ctp-surface0 hover:bg-ctp-surface1 transition-colors ${selectionMode && row.getIsSelected() ? "bg-ctp-mauve/10" : ""}`}
                    >
                      {selectionMode && (
                        <td className="w-12 p-4">
                          <Checkbox
                            checked={row.getIsSelected()}
                            onChange={row.getToggleSelectedHandler()}
                            className="cursor-pointer"
                          />
                        </td>
                      )}
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                </table>
              </ScrollFade>
            </Card>

            {table.getPageCount() > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <span className="text-zinc-400">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
