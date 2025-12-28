import { useState, type ReactNode } from 'react'

interface FilterSectionProps {
  title: string
  icon: ReactNode
  iconColor: string
  defaultOpen?: boolean
  children: ReactNode
  onClear?: () => void
  hasSelection?: boolean
}

export function FilterSection({
  title,
  icon,
  iconColor,
  defaultOpen = true,
  children,
  onClear,
  hasSelection = false,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider cursor-pointer hover:text-ctp-text transition-colors"
          aria-expanded={isOpen}
        >
          <svg
            className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className={iconColor}>{icon}</span>
          {title}
        </button>
        {onClear && hasSelection && (
          <button
            onClick={onClear}
            className="text-xs text-ctp-subtext1 hover:text-ctp-text transition-colors px-2 py-0.5"
          >
            Clear
          </button>
        )}
      </div>
      {isOpen && <div className="mt-2">{children}</div>}
    </div>
  )
}
