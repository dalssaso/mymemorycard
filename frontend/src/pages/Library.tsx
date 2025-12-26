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
import { LibrarySidebar } from '@/components/sidebar'
import { GameCardSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'

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
  last_played: string | null
  metacritic_score: number | null
  release_date: string | null
  is_favorite: boolean
}

const columnHelper = createColumnHelper<Game>()

const COLUMN_LABELS: Record<string, string> = {
  name: 'Name',
  platform_display_name: 'Platform',
  status: 'Status',
  metacritic_score: 'Critic Score',
  user_rating: 'Your Rating',
  total_minutes: 'Playtime',
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

export function Library() {
  const { showToast } = useToast()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false)
  const [showColumnSettings, setShowColumnSettings] = useState<boolean>(false)

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await gamesAPI.export(format)
      const blob = new Blob([response.data], {
        type: format === 'json' ? 'application/json' : 'text/csv'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mymemorycard-export-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      showToast(`Library exported as ${format.toUpperCase()}`, 'success')
    } catch (error) {
      showToast('Failed to export library', 'error')
    }
  }

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

  const hasActiveFilters = Boolean(platformFilter || statusFilter || globalFilter || favoritesOnly)

  const handleClearFilters = () => {
    setPlatformFilter('')
    setStatusFilter('')
    setGlobalFilter('')
    setFavoritesOnly(false)
  }

  const sidebarContent = (
    <LibrarySidebar
      platformFilter={platformFilter}
      setPlatformFilter={setPlatformFilter}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      favoritesOnly={favoritesOnly}
      setFavoritesOnly={setFavoritesOnly}
      viewMode={viewMode}
      setViewMode={setViewMode}
      uniquePlatforms={uniquePlatforms}
      uniqueStatuses={uniqueStatuses}
      onClearFilters={handleClearFilters}
      hasActiveFilters={hasActiveFilters}
    />
  )

  return (
    <PageLayout sidebar={sidebarContent}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-primary-purple">Library</h1>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('json')}
              className="px-4 py-2 bg-primary-cyan/20 border border-primary-cyan/30 text-primary-cyan hover:bg-primary-cyan/30 rounded transition-all text-sm"
            >
              Export JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-primary-green/20 border border-primary-green/30 text-primary-green hover:bg-primary-green/30 rounded transition-all text-sm"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Search and Column Settings */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search games..."
            aria-label="Search games in your library"
            className="input flex-1 min-w-[200px]"
          />
          
          {/* Column Visibility (Table View Only) */}
          {viewMode === 'table' && (
            <div className="relative">
              <button
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="flex items-center gap-2 px-3 py-2 bg-bg-tertiary border border-zinc-700 rounded-lg hover:border-primary-purple transition-colors text-sm text-zinc-300"
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
              </button>
              {showColumnSettings && (
                <div
                  id="column-settings"
                  className="absolute top-full left-0 mt-2 p-3 bg-bg-secondary border border-zinc-700 rounded-lg shadow-lg z-10 min-w-[200px]"
                >
                  <div className="flex flex-col gap-2">
                    {table.getAllLeafColumns().map((column) => (
                      <label
                        key={column.id}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:text-white"
                      >
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                          className="w-4 h-4 rounded border-zinc-700 bg-bg-secondary text-primary-purple focus:ring-2 focus:ring-primary-purple"
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
        
        {/* Results count and page size */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-zinc-400">
            {(() => {
              const { pageIndex, pageSize } = table.getState().pagination
              const start = pageIndex * pageSize + 1
              const end = Math.min((pageIndex + 1) * pageSize, filteredGames.length)
              return `Showing ${start}-${end} of ${filteredGames.length} games`
            })()}
            {(platformFilter || statusFilter || favoritesOnly) && ` (filtered from ${games.length} total)`}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm text-zinc-400">
              Items per page:
            </label>
            <select
              id="pageSize"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="input py-1 px-2 text-sm min-w-[70px]"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
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
