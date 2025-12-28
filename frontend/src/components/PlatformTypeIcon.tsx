interface PlatformTypeIconProps {
  type: 'pc' | 'console' | 'mobile' | 'physical'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  color?: string
}

const PLATFORM_TYPE_CONFIG = {
  pc: { icon: 'computer', label: 'PC' },
  console: { icon: 'videogame_asset', label: 'Console' },
  mobile: { icon: 'smartphone', label: 'Mobile' },
  physical: { icon: 'album', label: 'Physical' },
}

const SIZE_CLASSES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}

export function PlatformTypeIcon({ type, size = 'sm', showLabel = false, color }: PlatformTypeIconProps) {
  const config = PLATFORM_TYPE_CONFIG[type]

  return (
    <div className="flex items-center gap-1" style={color ? { color } : undefined}>
      <span className={`material-symbols-outlined ${SIZE_CLASSES[size]} ${!color ? 'text-gray-400' : ''}`}>
        {config.icon}
      </span>
      {showLabel && <span className={`text-sm ${!color ? 'text-gray-400' : ''}`}>{config.label}</span>}
    </div>
  )
}
