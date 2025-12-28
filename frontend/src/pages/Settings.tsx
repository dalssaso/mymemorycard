import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { BackButton, PageLayout } from '@/components/layout'
import { useToast } from '@/components/ui/Toast'
import { useTheme } from '@/contexts/ThemeContext'
import { preferencesAPI } from '@/lib/api'

type Theme = 'light' | 'dark' | 'auto'

interface UserPreferences {
  default_view: 'grid' | 'table'
  items_per_page: number
  theme: Theme
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const THEME_OPTIONS: Array<{ value: Theme; label: string; description: string }> = [
  { value: 'light', label: 'Light', description: 'Catppuccin Latte' },
  { value: 'dark', label: 'Dark', description: 'Catppuccin Mocha' },
  { value: 'auto', label: 'Auto', description: 'Match system preference' },
]

export function Settings() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { theme, setTheme } = useTheme()
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: async () => {
      const response = await preferencesAPI.get()
      return response.data as { preferences: UserPreferences }
    },
  })

  const updateMutation = useMutation({
    mutationFn: (prefs: Partial<UserPreferences>) => preferencesAPI.update(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
      showToast('Preferences saved', 'success')
    },
    onError: () => {
      showToast('Failed to save preferences', 'error')
    },
  })

  const preferences = data?.preferences || {
    default_view: 'grid',
    items_per_page: 25,
    theme,
  }

  const handleViewChange = (view: 'grid' | 'table') => {
    updateMutation.mutate({ default_view: view })
  }

  const handlePageSizeChange = (size: number) => {
    updateMutation.mutate({ items_per_page: size })
  }

  const handleThemeChange = async (nextTheme: Theme) => {
    if (isUpdatingTheme || nextTheme === theme) {
      return
    }

    setIsUpdatingTheme(true)
    await setTheme(nextTheme)
    setIsUpdatingTheme(false)
    showToast('Theme updated', 'success')
  }

  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <BackButton
              iconOnly={true}
              className="md:hidden p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
            />
            <h1 className="text-4xl font-bold text-ctp-text">Settings</h1>
          </div>
          <div className="card">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-ctp-surface1 rounded w-1/3"></div>
              <div className="h-12 bg-ctp-surface1 rounded"></div>
              <div className="h-8 bg-ctp-surface1 rounded w-1/3"></div>
              <div className="h-12 bg-ctp-surface1 rounded"></div>
            </div>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <BackButton
            iconOnly={true}
            className="md:hidden p-2 rounded-lg text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text transition-all"
          />
          <h1 className="text-4xl font-bold text-ctp-text">Settings</h1>
        </div>

        <div className="card space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-ctp-mauve mb-4">
              Library View
            </h2>
            <p className="text-sm text-ctp-subtext0 mb-4">
              Choose how your game library is displayed by default.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleViewChange('grid')}
                disabled={updateMutation.isPending}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  preferences.default_view === 'grid'
                    ? 'bg-ctp-mauve/20 border-ctp-mauve text-ctp-mauve'
                    : 'bg-ctp-surface0 border-ctp-surface1 text-ctp-subtext0 hover:border-ctp-surface2'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                    />
                  </svg>
                  <span className="font-medium">Grid View</span>
                  <span className="text-xs text-ctp-overlay1">Game covers in a grid</span>
                </div>
              </button>
              <button
                onClick={() => handleViewChange('table')}
                disabled={updateMutation.isPending}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  preferences.default_view === 'table'
                    ? 'bg-ctp-mauve/20 border-ctp-mauve text-ctp-mauve'
                    : 'bg-ctp-surface0 border-ctp-surface1 text-ctp-subtext0 hover:border-ctp-surface2'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
                    />
                  </svg>
                  <span className="font-medium">Table View</span>
                  <span className="text-xs text-ctp-overlay1">Sortable list format</span>
                </div>
              </button>
            </div>
          </div>

          <div className="border-t border-ctp-surface0 pt-8">
            <h2 className="text-xl font-semibold text-ctp-mauve mb-4">
              Items Per Page
            </h2>
            <p className="text-sm text-ctp-subtext0 mb-4">
              Number of games to show per page in your library.
            </p>
            <div className="flex gap-2">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => handlePageSizeChange(size)}
                  disabled={updateMutation.isPending}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    preferences.items_per_page === size
                      ? 'bg-ctp-teal/20 border-ctp-teal text-ctp-teal'
                      : 'bg-ctp-surface0 border-ctp-surface1 text-ctp-subtext0 hover:border-ctp-surface2'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-ctp-surface0 pt-8">
            <h2 className="text-xl font-semibold text-ctp-mauve mb-4">
              Theme
            </h2>
            <p className="text-sm text-ctp-subtext0 mb-4">
              Appearance settings for the application.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleThemeChange(option.value)}
                  disabled={isUpdatingTheme}
                  className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${
                    theme === option.value
                      ? 'bg-ctp-mauve/20 border-ctp-mauve text-ctp-mauve'
                      : 'bg-ctp-surface0 border-ctp-surface1 text-ctp-subtext0 hover:border-ctp-surface2'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-ctp-overlay1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
