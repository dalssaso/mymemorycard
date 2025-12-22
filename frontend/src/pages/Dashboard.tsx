import { useAuth } from '@/contexts/AuthContext'
import { useNavigate, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { gamesAPI } from '@/lib/api'

export function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await gamesAPI.getAll()
      return response.data as { games: any[] }
    },
  })

  const games = data?.games || []
  const totalGames = games.length
  const inProgressGames = games.filter((g) => g.status === 'playing').length
  const completedGames = games.filter((g) => g.status === 'completed' || g.status === 'finished').length

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-primary-purple">
            Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <Link to="/library" className="btn btn-secondary">
              Library
            </Link>
            <Link to="/import" className="btn btn-secondary">
              Import
            </Link>
            <span className="text-zinc-400">
              Welcome, <span className="text-white font-medium">{user?.username}</span>
            </span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-zinc-400 text-sm mb-2">Total Games</h3>
            <p className="text-3xl font-bold text-primary-cyan">{totalGames}</p>
          </div>
          
          <div className="card">
            <h3 className="text-zinc-400 text-sm mb-2">In Progress</h3>
            <p className="text-3xl font-bold text-primary-yellow">{inProgressGames}</p>
          </div>
          
          <div className="card">
            <h3 className="text-zinc-400 text-sm mb-2">Completed</h3>
            <p className="text-3xl font-bold text-primary-green">{completedGames}</p>
          </div>
        </div>

        {totalGames === 0 ? (
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Get Started</h2>
            <p className="text-zinc-400 mb-4">
              Import your games to start tracking your library
            </p>
            <Link to="/import" className="btn btn-primary inline-block">
              Import Games
            </Link>
          </div>
        ) : (
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
            <div className="flex gap-4">
              <Link to="/library" className="btn btn-primary">
                View Library
              </Link>
              <Link to="/import" className="btn btn-secondary">
                Import More Games
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
