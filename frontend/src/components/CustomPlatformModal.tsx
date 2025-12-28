import { useEffect, useState } from 'react'
import { PlatformIconBadge } from './PlatformIcon'
import { PlatformTypeIcon } from './PlatformTypeIcon'

interface CustomPlatformModalProps {
  isOpen: boolean
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: (data: {
    displayName: string
    platformType: string
    websiteUrl?: string
    defaultIconUrl?: string
    colorPrimary?: string
  }) => void
}

const PLATFORM_TYPES: Array<{ value: 'pc' | 'console' | 'mobile' | 'physical'; label: string }> = [
  { value: 'pc', label: 'PC' },
  { value: 'console', label: 'Console' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'physical', label: 'Physical' },
]

export function CustomPlatformModal({
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}: CustomPlatformModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [platformType, setPlatformType] = useState<'pc' | 'console' | 'mobile' | 'physical' | ''>('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [defaultIconUrl, setDefaultIconUrl] = useState('')
  const [colorPrimary, setColorPrimary] = useState('#6B7280')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setDisplayName('')
      setPlatformType('')
      setWebsiteUrl('')
      setDefaultIconUrl('')
      setColorPrimary('#6B7280')
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!displayName.trim()) {
      setError('Display name is required')
      return
    }

    if (!platformType) {
      setError('Platform type is required')
      return
    }

    // Validate SVG URL if provided
    if (defaultIconUrl.trim()) {
      const url = defaultIconUrl.trim().toLowerCase()
      if (!url.endsWith('.svg') && !url.startsWith('data:image/svg+xml')) {
        setError('Icon URL must be an SVG file (ending in .svg or data URI)')
        return
      }
    }

    onSubmit({
      displayName: displayName.trim(),
      platformType,
      websiteUrl: websiteUrl.trim() || undefined,
      defaultIconUrl: defaultIconUrl.trim() || undefined,
      colorPrimary: colorPrimary || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-white mb-2">Add Custom Platform</h3>
        <p className="text-sm text-gray-400 mb-4">
          Create a custom platform for stores or systems not in the default list.
        </p>

        {error && (
          <div className="mb-4 bg-primary-red/20 border border-primary-red text-primary-red px-3 py-2 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-400">
              Display Name <span className="text-primary-red">*</span>
            </label>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="input w-full"
              placeholder="Example: Nintendo Switch"
            />
          </div>

          {/* Platform Type */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-400">
              Platform Type <span className="text-primary-red">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORM_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setPlatformType(type.value)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors flex items-center gap-2 ${
                    platformType === type.value
                      ? 'border-primary-cyan bg-primary-cyan/10 text-primary-cyan'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <PlatformTypeIcon type={type.value} size="sm" />
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-400">Website URL</label>
            <input
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              className="input w-full"
              type="url"
              placeholder="https://example.com"
            />
          </div>

          {/* Icon URL */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-400">Icon URL (SVG only)</label>
            <input
              value={defaultIconUrl}
              onChange={(event) => setDefaultIconUrl(event.target.value)}
              className="input w-full"
              type="url"
              placeholder="https://cdn.simpleicons.org/steam/ffffff"
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide an SVG icon URL from{' '}
              <a
                href="https://simpleicons.org"
                target="_blank"
                rel="noreferrer"
                className="text-primary-cyan hover:text-primary-purple"
              >
                Simple Icons
              </a>{' '}
              or leave empty for text badge.
            </p>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-400">Brand Color</label>
            <div className="flex gap-2">
              <input
                value={colorPrimary}
                onChange={(event) => setColorPrimary(event.target.value)}
                className="input flex-1"
                type="text"
                placeholder="#6B7280"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
              <input
                value={colorPrimary}
                onChange={(event) => setColorPrimary(event.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
                type="color"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Use the platform's official brand color for consistency.
            </p>
          </div>

          {/* Live Preview */}
          {displayName && (
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
              <label className="block text-xs font-medium mb-2 text-gray-400">Preview</label>
              <div className="flex items-center justify-center py-4">
                <PlatformIconBadge
                  platform={{
                    displayName: displayName || 'Platform',
                    iconUrl: defaultIconUrl.trim() || null,
                    colorPrimary: colorPrimary || '#6B7280',
                  }}
                  size="lg"
                  showLabel={true}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Saving...' : 'Save Platform'}
          </button>
        </div>
      </div>
    </div>
  )
}
