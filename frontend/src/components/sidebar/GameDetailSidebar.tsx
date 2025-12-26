import { Link } from '@tanstack/react-router'

interface GameDetailSidebarProps {
  gameId: string
  platformId: string
  status: string | null
  onStatusChange: (status: string) => void
  isUpdating?: boolean
}

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog', color: 'gray' },
  { value: 'playing', label: 'Playing', color: 'cyan' },
  { value: 'finished', label: 'Finished', color: 'green' },
  { value: 'completed', label: 'Completed', color: 'yellow' },
  { value: 'dropped', label: 'Dropped', color: 'red' },
]

const SECTIONS = [
  { id: 'about', label: 'About' },
  { id: 'notes', label: 'Notes' },
  { id: 'stats', label: 'My Stats' },
  { id: 'resources', label: 'External Resources' },
  { id: 'playtime', label: 'Play Stats' },
]

export function GameDetailSidebar({
  status,
  onStatusChange,
  isUpdating,
}: GameDetailSidebarProps) {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/library"
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 rounded-lg transition-colors text-sm"
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
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Back to Library
        </Link>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Quick Status
        </h3>
        <div className="space-y-1">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              disabled={isUpdating}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all disabled:opacity-50 ${
                status === option.value
                  ? `bg-primary-${option.color}/20 text-primary-${option.color} border border-primary-${option.color}/30`
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Jump to Section
        </h3>
        <div className="space-y-1">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
