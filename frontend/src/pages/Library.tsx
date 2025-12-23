import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { gamesAPI } from '@/lib/api'
import { GameCard } from '@/components/GameCard'
import { PageLayout } from '@/components/layout'
import { GameCardSkeleton } from '@/components/ui/Skeleton'

interface Game {
  id: string
  name: string
  cover_art_url: string | null
  platform_id: string
  platform_name: string
  platform_display_name: string
  status: string
  user_rating: number | null
  total_minutes: number
  last_played: Date | null
  metacritic_score: number | null
  release_date: string | null
  is_favorite: boolean
}

const columnHelper = createColumnHelper<Game>()

export function Library() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await gamesAPI.getAll()
      return response.data as { games: Game[] }
    },
  })

  const games = data?.games || []
  
  // Get unique platforms and statuses for filters
  const uniquePlatforms = useMemo(() => {
    const platforms = new Set(games.map(g => g.platform_display_name))
    return Array.from(platforms).sort()
  }, [games])
  
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(games.map(g => g.status))
    return Array.from(statuses).sort()
  }, [games])
  
  // Filter games based on platform, status, and favorites
  const filteredGames = useMemo(() => {
    return games.filter(game => {
      if (platformFilter && game.platform_display_name !== platformFilter) return false
      if (statusFilter && game.status !== statusFilter) return false
      if (favoritesOnly && !game.is_favorite) return false
      return true
    })
  }, [games, platformFilter, statusFilter, favoritesOnly])

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => (
          <Link
            to="/library/$id"
            params={{ id: info.row.original.id }}
            className="text-blue-400 hover:text-blue-300"
          >
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor('platform_display_name', {
        header: 'Platform',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('metacritic_score', {
        header: 'Score',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('user_rating', {
        header: 'Rating',
        cell: (info) => (info.getValue() ? `${info.getValue()}/10` : '-'),
      }),
      columnHelper.accessor('total_minutes', {
        header: 'Playtime',
        cell: (info) => {
          const minutes = info.getValue()
          const hours = Math.floor(minutes / 60)
          const mins = minutes % 60
          return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
        },
      }),
    ],
    []
  )

  const table = useReactTable({
    data: filteredGames,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  })

  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Library</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="card max-w-md">
            <h2 className="text-2xl font-bold text-primary-red mb-4">Error</h2>
            <p className="text-zinc-400">Failed to load your library. Please try again.</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-primary-purple">Library</h1>

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded border transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary-purple border-purple-500 text-white'
                    : 'bg-bg-secondary border-zinc-700 text-zinc-400'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded border transition-all ${
                  viewMode === 'table'
                    ? 'bg-primary-purple border-purple-500 text-white'
                    : 'bg-bg-secondary border-zinc-700 text-zinc-400'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search games..."
              className="input flex-1 min-w-[200px]"
            />
            
            {/* Platform Filter */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="input min-w-[150px]"
            >
              <option value="">All Platforms</option>
              {uniquePlatforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input min-w-[150px]"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            
            {/* Favorites Filter */}
            <label className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary border border-zinc-700 rounded-lg cursor-pointer hover:border-red-500 transition-colors">
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(e) => setFavoritesOnly(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-bg-secondary text-red-500 focus:ring-2 focus:ring-red-500"
              />
              <span className="text-sm text-zinc-300">Favorites Only</span>
            </label>
            
            {/* Clear Filters */}
            {(platformFilter || statusFilter || globalFilter || favoritesOnly) && (
              <button
                onClick={() => {
                  setPlatformFilter('')
                  setStatusFilter('')
                  setGlobalFilter('')
                  setFavoritesOnly(false)
                }}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            )}
          </div>
          
          {/* Column Visibility (Table View Only) */}
          {viewMode === 'table' && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-zinc-400">Show columns:</span>
              {table.getAllLeafColumns().map(column => (
                <label key={column.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={column.getToggleVisibilityHandler()}
                    className="w-4 h-4 rounded border-zinc-700 bg-bg-secondary text-primary-purple focus:ring-2 focus:ring-primary-purple"
                  />
                  <span className="text-zinc-300">{column.id}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        
        {/* Results count */}
        <div className="mb-4 text-sm text-zinc-400">
          Showing {table.getRowModel().rows.length} of {filteredGames.length} games
          {(platformFilter || statusFilter || favoritesOnly) && ` (filtered from ${games.length} total)`}
        </div>

        {games.length === 0 ? (
          <div className="card text-center py-12">
            <h2 className="text-2xl font-bold mb-4">No Games Yet</h2>
            <p className="text-zinc-400 mb-6">
              Start building your library by importing games
            </p>
            <Link to="/import" className="btn btn-primary inline-block">
              Import Games
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {table.getRowModel().rows.map((row) => (
                <GameCard key={row.original.id} {...row.original} />
              ))}
            </div>

            {table.getPageCount() > 1 && (
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <span className="text-zinc-400">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="btn btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-zinc-700">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="text-left p-4 text-zinc-400 font-medium cursor-pointer hover:text-white"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-2">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() && (
                              <span>{header.column.getIsSorted() === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-zinc-800 hover:bg-bg-hover transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {table.getPageCount() > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <span className="text-zinc-400">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="btn btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  )
}
