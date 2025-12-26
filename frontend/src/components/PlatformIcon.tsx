interface PlatformIconProps {
  platform: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const PLATFORM_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  steam: {
    label: 'Steam',
    bgColor: 'bg-[#1b2838]',
    textColor: 'text-white',
  },
  playstation: {
    label: 'PS',
    bgColor: 'bg-[#003087]',
    textColor: 'text-white',
  },
  xbox: {
    label: 'Xbox',
    bgColor: 'bg-[#107c10]',
    textColor: 'text-white',
  },
  'epic games store': {
    label: 'Epic',
    bgColor: 'bg-gray-800',
    textColor: 'text-white',
  },
  'epic games': {
    label: 'Epic',
    bgColor: 'bg-gray-800',
    textColor: 'text-white',
  },
  pc: {
    label: 'PC',
    bgColor: 'bg-gray-700',
    textColor: 'text-gray-200',
  },
  nintendo: {
    label: 'Nintendo',
    bgColor: 'bg-[#e60012]',
    textColor: 'text-white',
  },
  'nintendo switch': {
    label: 'Switch',
    bgColor: 'bg-[#e60012]',
    textColor: 'text-white',
  },
  gog: {
    label: 'GOG',
    bgColor: 'bg-purple-700',
    textColor: 'text-white',
  },
}

const SIZE_CLASSES = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-2.5 py-1',
}

function getPlatformConfig(platform: string) {
  const normalized = platform.toLowerCase()
  
  if (PLATFORM_CONFIG[normalized]) {
    return PLATFORM_CONFIG[normalized]
  }
  
  if (normalized.includes('playstation') || normalized.includes('ps')) {
    return PLATFORM_CONFIG['playstation']
  }
  if (normalized.includes('xbox')) {
    return PLATFORM_CONFIG['xbox']
  }
  if (normalized.includes('nintendo') || normalized.includes('switch')) {
    return PLATFORM_CONFIG['nintendo']
  }
  if (normalized.includes('steam')) {
    return PLATFORM_CONFIG['steam']
  }
  if (normalized.includes('epic')) {
    return PLATFORM_CONFIG['epic games']
  }
  
  return { label: platform, bgColor: 'bg-gray-700', textColor: 'text-gray-200' }
}

export function PlatformIcon({ platform, size = 'md', showLabel = false }: PlatformIconProps) {
  const config = getPlatformConfig(platform)
  
  return (
    <div className="flex items-center gap-1.5" title={platform}>
      <span className={`${SIZE_CLASSES[size]} ${config.bgColor} ${config.textColor} rounded font-medium`}>
        {config.label}
      </span>
      {showLabel && <span className="text-sm text-gray-300">{platform}</span>}
    </div>
  )
}

interface PlatformIconsProps {
  platforms: string[]
  size?: 'sm' | 'md' | 'lg'
}

export function PlatformIcons({ platforms, size = 'md' }: PlatformIconsProps) {
  return (
    <div className="flex items-center gap-1">
      {platforms.map((platform) => (
        <PlatformIcon key={platform} platform={platform} size={size} />
      ))}
    </div>
  )
}
