import { useEffect, useState } from 'react'

interface CustomPlatformModalProps {
  isOpen: boolean
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: (data: { displayName: string; platformType?: string | null }) => void
}

const PLATFORM_TYPES = ['pc', 'console', 'mobile', 'other']

export function CustomPlatformModal({
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}: CustomPlatformModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [platformType, setPlatformType] = useState<string>('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setDisplayName('')
      setPlatformType('')
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!displayName.trim()) {
      setError('Display name is required')
      return
    }

    onSubmit({
      displayName: displayName.trim(),
      platformType: platformType.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-2">Add Custom Platform</h3>
        <p className="text-sm text-gray-400 mb-4">
          Use this for platforms not listed from RAWG.
        </p>

        {error && (
          <div
            className={[
              'mb-4 bg-primary-red/20 border border-primary-red text-primary-red',
              'px-3 py-2 rounded',
            ].join(' ')}
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-400">Display Name</label>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="input w-full"
              placeholder="Example: Nintendo Switch"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-400">Platform Type</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPlatformType(type)}
                  className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                    platformType === type
                      ? 'border-primary-cyan bg-primary-cyan/10 text-primary-cyan'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {type}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPlatformType('')}
                className={[
                  'px-3 py-1 rounded-lg text-sm border border-gray-700 text-gray-400',
                  'hover:border-gray-500',
                ].join(' ')}
              >
                Clear
              </button>
            </div>
          </div>
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
