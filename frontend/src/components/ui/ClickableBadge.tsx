interface ClickableBadgeProps {
  label: string
  percentage: number
  color: string
  onClick: () => void
  className?: string
}

export function ClickableBadge({
  label,
  percentage,
  color,
  onClick,
  className = '',
}: ClickableBadgeProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ctp-mauve focus-visible:ring-offset-2 ${className}`}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: `color-mix(in srgb, ${color} 50%, transparent)`,
        color: color,
      }}
      aria-label={`View ${label} progress details, currently at ${percentage}%`}
    >
      <span className="font-semibold">{label}:</span>
      <span>{percentage}%</span>
    </button>
  )
}
