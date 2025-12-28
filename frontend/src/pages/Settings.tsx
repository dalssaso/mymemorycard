import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { BackButton, PageLayout } from '@/components/layout'
import { useToast } from '@/components/ui/Toast'
import { useTheme } from '@/contexts/ThemeContext'
import { preferencesAPI, aiAPI } from '@/lib/api'

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

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'ollama', label: 'Ollama (Local)' },
  { value: 'lmstudio', label: 'LM Studio (Local)' },
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

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>('openai')
  const [providerForms, setProviderForms] = useState<Record<string, {
    base_url?: string | null
    api_key?: string | null
    api_key_masked?: string | null
    model?: string
    image_api_key?: string | null
    image_api_key_masked?: string | null
    image_model?: string | null
    temperature?: number
    max_tokens?: number
  }>>({})

  const { data: aiData } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: async () => {
      const response = await aiAPI.getSettings()
      const { providers, activeProvider } = response.data

      // Initialize forms for all configured providers
      const forms: typeof providerForms = {}
      providers.forEach((p) => {
        forms[p.provider] = {
          base_url: p.base_url,
          api_key_masked: p.api_key_masked,
          model: p.model,
          image_api_key_masked: p.image_api_key_masked,
          image_model: p.image_model,
          temperature: p.temperature,
          max_tokens: p.max_tokens,
        }
      })
      setProviderForms(forms)

      // Set selected provider to active one or first in list
      if (activeProvider) {
        setSelectedProvider(activeProvider.provider)
      } else if (providers.length > 0) {
        setSelectedProvider(providers[0].provider)
      }

      return response.data
    },
  })

  const updateAiMutation = useMutation({
    mutationFn: aiAPI.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] })
      showToast('AI provider settings saved', 'success')
    },
    onError: () => {
      showToast('Failed to save provider settings', 'error')
    },
  })

  const setActiveProviderMutation = useMutation({
    mutationFn: aiAPI.setActiveProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] })
      showToast('Active provider updated', 'success')
    },
    onError: () => {
      showToast('Failed to set active provider', 'error')
    },
  })

  const currentForm = providerForms[selectedProvider] || {}

  const updateCurrentForm = (updates: Partial<typeof currentForm>) => {
    setProviderForms({
      ...providerForms,
      [selectedProvider]: {
        ...currentForm,
        ...updates,
      },
    })
  }

  const handleAiSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = providerForms[selectedProvider]
    if (!form) return

    updateAiMutation.mutate({
      provider: selectedProvider,
      baseUrl: form.base_url,
      apiKey: form.api_key !== undefined ? form.api_key : undefined,
      model: form.model,
      imageApiKey: form.image_api_key !== undefined ? form.image_api_key : undefined,
      imageModel: form.image_model,
      temperature: form.temperature,
      maxTokens: form.max_tokens,
      setActive: !aiData?.activeProvider || aiData.activeProvider.provider !== selectedProvider,
    })
  }

  const handleProviderClick = (provider: string) => {
    setSelectedProvider(provider)
    // If provider not configured yet, initialize empty form
    if (!providerForms[provider]) {
      setProviderForms({
        ...providerForms,
        [provider]: {
          temperature: 0.7,
          max_tokens: 2000,
        },
      })
    }
  }

  const isProviderConfigured = (provider: string) => {
    return providerForms[provider]?.api_key_masked !== null && providerForms[provider]?.api_key_masked !== undefined
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

          <div className="border-t border-ctp-surface0 pt-8">
            <h2 className="text-xl font-semibold text-ctp-mauve mb-4">
              AI Curator Settings
            </h2>
            <p className="text-sm text-ctp-subtext0 mb-4">
              Configure AI-powered features for collection suggestions and recommendations.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-ctp-text mb-3">
                Select Provider to Configure
              </label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {PROVIDER_OPTIONS.map((option) => {
                  const isActive = aiData?.activeProvider?.provider === option.value
                  const isConfigured = isProviderConfigured(option.value)
                  const isSelected = selectedProvider === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleProviderClick(option.value)}
                      className={`relative w-full px-3 py-3 rounded-lg text-sm transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-ctp-mauve/20 text-ctp-mauve border-2 border-ctp-mauve/50'
                          : 'text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text border-2 border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isConfigured && (
                          <span className="w-2 h-2 rounded-full bg-ctp-green"></span>
                        )}
                        {option.label}
                      </span>
                      {isActive && (
                        <svg className="w-4 h-4 text-ctp-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-ctp-overlay1 mt-2">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-ctp-green"></span>
                  Configured
                </span>
                <span className="mx-2">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-ctp-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Active (currently in use)
                </span>
                <span className="mx-2">•</span>
                <a
                  href="https://github.com/dalssaso/mymemorycard/blob/main/docs/ai-curator-settings/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ctp-blue hover:underline"
                >
                  View setup guides
                </a>
              </p>
              {selectedProvider !== 'openai' && !currentForm.image_api_key_masked && (
                <div className="mt-3 p-3 bg-ctp-yellow/10 border border-ctp-yellow/30 rounded-lg">
                  <p className="text-xs text-ctp-yellow flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                      <strong>Note:</strong> AI-generated collection cover images require an OpenAI API key. You can configure a separate OpenAI key for image generation in Advanced Options below.
                    </span>
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleAiSettingsSubmit} className="space-y-6 border-t border-ctp-surface0 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-ctp-text">
                  {PROVIDER_OPTIONS.find(p => p.value === selectedProvider)?.label} Configuration
                </h3>
                {isProviderConfigured(selectedProvider) && aiData?.activeProvider?.provider !== selectedProvider && (
                  <button
                    type="button"
                    onClick={() => setActiveProviderMutation.mutate(selectedProvider)}
                    disabled={setActiveProviderMutation.isPending}
                    className="text-sm px-3 py-1.5 bg-ctp-green/20 text-ctp-green border border-ctp-green/30 rounded-lg hover:bg-ctp-green/30 transition-colors disabled:opacity-50"
                  >
                    Set as Active
                  </button>
                )}
              </div>

              {(selectedProvider === 'ollama' || selectedProvider === 'lmstudio' || selectedProvider === 'openrouter') && (
                <div>
                  <label className="block text-sm font-medium text-ctp-text mb-2">
                    Base URL {selectedProvider === 'openrouter' && '(Optional)'}
                  </label>
                  <input
                    type="url"
                    value={currentForm.base_url || ''}
                    onChange={(e) => updateCurrentForm({ base_url: e.target.value || null })}
                    placeholder={
                      selectedProvider === 'ollama' ? 'http://localhost:11434/v1' :
                      selectedProvider === 'lmstudio' ? 'http://localhost:1234/v1' :
                      'https://openrouter.ai/api/v1'
                    }
                    className="w-full px-4 py-2 rounded-lg bg-ctp-surface0 border border-ctp-surface1 text-ctp-text focus:outline-none focus:border-ctp-mauve"
                  />
                  <p className="text-xs text-ctp-overlay1 mt-1">
                    {selectedProvider === 'ollama' && 'Default: http://localhost:11434/v1'}
                    {selectedProvider === 'lmstudio' && 'Default: http://localhost:1234/v1'}
                    {selectedProvider === 'openrouter' && 'Default: https://openrouter.ai/api/v1'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-ctp-text mb-2">
                  API Key
                </label>
                <input
                  type={currentForm.api_key === undefined && currentForm.api_key_masked ? 'text' : 'password'}
                  value={currentForm.api_key !== undefined ? currentForm.api_key || '' : currentForm.api_key_masked || ''}
                  onChange={(e) => updateCurrentForm({ api_key: e.target.value || null })}
                  onFocus={(e) => {
                    if (currentForm.api_key === undefined && currentForm.api_key_masked) {
                      updateCurrentForm({ api_key: '' })
                      setTimeout(() => e.target.select(), 0)
                    }
                  }}
                  placeholder={
                    selectedProvider === 'ollama' || selectedProvider === 'lmstudio'
                      ? 'Not required for local models'
                      : currentForm.api_key_masked
                      ? 'Click to replace existing key'
                      : 'Enter your API key'
                  }
                  className="w-full px-4 py-2 rounded-lg bg-ctp-surface0 border border-ctp-surface1 text-ctp-text focus:outline-none focus:border-ctp-mauve"
                  readOnly={currentForm.api_key === undefined && currentForm.api_key_masked !== null}
                />
                <p className="text-xs text-ctp-overlay1 mt-1">
                  {currentForm.api_key_masked && currentForm.api_key === undefined
                    ? 'API key configured. Click the field to replace it.'
                    : 'Your API key is encrypted before being stored.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ctp-text mb-2">
                  Model
                </label>
                <input
                  type="text"
                  value={currentForm.model || 'gpt-4.1-mini'}
                  onChange={(e) => updateCurrentForm({ model: e.target.value })}
                  placeholder={
                    selectedProvider === 'openrouter'
                      ? 'e.g., openai/gpt-4.1-mini, anthropic/claude-3.5-sonnet'
                      : selectedProvider === 'ollama'
                      ? 'e.g., llama3.2:3b, mistral:latest'
                      : 'e.g., gpt-4.1-mini, gpt-4o-mini'
                  }
                  className="w-full px-4 py-2 rounded-lg bg-ctp-surface0 border border-ctp-surface1 text-ctp-text focus:outline-none focus:border-ctp-mauve"
                />
                <p className="text-xs text-ctp-overlay1 mt-1">
                  {selectedProvider === 'openrouter' && (
                    <span>
                      <strong>Note:</strong> OpenRouter requires provider prefix (e.g., openai/gpt-4.1-mini, anthropic/claude-3.5-sonnet).{' '}
                      <a
                        href="https://openrouter.ai/models"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ctp-blue hover:underline"
                      >
                        View available models
                      </a>
                    </span>
                  )}
                  {selectedProvider === 'ollama' && 'Recommended: llama3.2:3b, mistral:latest, qwen2.5:3b'}
                  {selectedProvider === 'lmstudio' && 'Use the model name shown in LM Studio server tab'}
                  {selectedProvider === 'openai' && 'Recommended: gpt-4.1-mini (fast & cheap), gpt-4o-mini, gpt-4o'}
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-ctp-blue hover:underline flex items-center gap-1"
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                  <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {showAdvanced && (
                <div className="space-y-4 pl-4 border-l-2 border-ctp-surface1">
                  <div>
                    <label className="block text-sm font-medium text-ctp-text mb-2">
                      Image API Key (OpenAI - Optional)
                    </label>
                    <input
                      type={currentForm.image_api_key === undefined && currentForm.image_api_key_masked ? 'text' : 'password'}
                      value={currentForm.image_api_key !== undefined ? currentForm.image_api_key || '' : currentForm.image_api_key_masked || ''}
                      onChange={(e) => updateCurrentForm({ image_api_key: e.target.value || null })}
                      onFocus={(e) => {
                        if (currentForm.image_api_key === undefined && currentForm.image_api_key_masked) {
                          updateCurrentForm({ image_api_key: '' })
                          setTimeout(() => e.target.select(), 0)
                        }
                      }}
                      placeholder={
                        currentForm.image_api_key_masked && currentForm.image_api_key === undefined
                          ? 'Click to replace existing key'
                          : selectedProvider === 'openai'
                          ? 'Leave empty to use main API key'
                          : 'Enter OpenAI API key for image generation'
                      }
                      className="w-full px-4 py-2 rounded-lg bg-ctp-surface0 border border-ctp-surface1 text-ctp-text focus:outline-none focus:border-ctp-mauve"
                      readOnly={currentForm.image_api_key === undefined && currentForm.image_api_key_masked !== null}
                    />
                    <p className="text-xs text-ctp-overlay1 mt-1">
                      {currentForm.image_api_key_masked && currentForm.image_api_key === undefined
                        ? 'Separate OpenAI API key configured for image generation.'
                        : selectedProvider === 'openai'
                        ? 'If not specified, the main API key will be used for image generation.'
                        : 'Provide an OpenAI API key to enable AI-generated collection cover images.'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ctp-text mb-2">
                      Image Model
                    </label>
                    <input
                      type="text"
                      value={currentForm.image_model || 'dall-e-3'}
                      onChange={(e) => updateCurrentForm({ image_model: e.target.value || null })}
                      placeholder="dall-e-3"
                      className="w-full px-4 py-2 rounded-lg bg-ctp-surface0 border border-ctp-surface1 text-ctp-text focus:outline-none focus:border-ctp-mauve"
                    />
                    <p className="text-xs text-ctp-overlay1 mt-1">
                      OpenAI DALL-E model for generating collection cover images
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ctp-text mb-2">
                      Temperature: {currentForm.temperature ?? 0.7}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={currentForm.temperature ?? 0.7}
                      onChange={(e) => updateCurrentForm({ temperature: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-xs text-ctp-overlay1 mt-1">
                      Lower = more focused, Higher = more creative
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ctp-text mb-2">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="16000"
                      value={currentForm.max_tokens ?? 2000}
                      onChange={(e) => updateCurrentForm({ max_tokens: parseInt(e.target.value, 10) })}
                      className="w-full px-4 py-2 rounded-lg bg-ctp-surface0 border border-ctp-surface1 text-ctp-text focus:outline-none focus:border-ctp-mauve"
                    />
                    <p className="text-xs text-ctp-overlay1 mt-1">
                      Maximum response length (affects cost)
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={updateAiMutation.isPending}
                className="px-6 py-2 bg-ctp-mauve text-ctp-base rounded-lg hover:bg-ctp-mauve/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateAiMutation.isPending ? 'Saving...' : `Save ${PROVIDER_OPTIONS.find((p) => p.value === selectedProvider)?.label} Settings`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
