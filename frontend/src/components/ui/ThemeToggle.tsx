import { useTheme } from '@/contexts/ThemeContext'

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364-1.414-1.414M8.05 8.05 6.636 6.636m10.728 0-1.414 1.414M8.05 15.95l-1.414 1.414M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z"
      />
    </svg>
  )
}

function AutoIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v2m0 12v2m8-8h-2M6 12H4m11.314 6.314-1.414-1.414M8.1 8.1 6.686 6.686m10.628 0-1.414 1.414M8.1 15.9l-1.414 1.414"
      />
      <circle cx="12" cy="12" r="3" strokeWidth={2} />
    </svg>
  )
}

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  const renderIcon = () => {
    if (theme === 'light') return <SunIcon />
    if (theme === 'dark') return <MoonIcon />
    return <AutoIcon />
  }

  const labelTheme = theme === 'auto' ? `auto (${resolvedTheme})` : theme

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-lg text-ctp-subtext0 hover:text-ctp-text hover:bg-ctp-surface0 transition-colors"
      aria-label={`Current theme: ${labelTheme}. Click to toggle light or dark.`}
      title={`Theme: ${labelTheme}`}
    >
      {renderIcon()}
    </button>
  )
}
