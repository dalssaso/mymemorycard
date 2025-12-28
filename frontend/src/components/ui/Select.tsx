import { useEffect, useRef, useState } from 'react'

export interface SelectOption<T = string> {
  value: T
  label: string
  colorVar?: string
  textClass?: string
  surfaceStrength?: number
  borderStrength?: number
  metadata?: React.ReactNode
  disabled?: boolean
}

interface SelectProps<T = string> {
  id: string
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showCheckmark?: boolean
  surfaceStyle?: 'default' | 'status'
  'aria-label'?: string
  'aria-describedby'?: string
}

const getOptionSurfaceStyle = <T extends string | number = string>(
  option: SelectOption<T>,
  surfaceStyle: 'default' | 'status'
): React.CSSProperties | undefined => {
  if (surfaceStyle !== 'status' || !option.colorVar) {
    return undefined
  }

  const surfaceStrength = option.surfaceStrength ?? 35
  const borderStrength = option.borderStrength ?? 55

  return {
    backgroundColor: `color-mix(in srgb, var(${option.colorVar}) ${surfaceStrength}%, transparent)`,
    borderColor: `color-mix(in srgb, var(${option.colorVar}) ${borderStrength}%, transparent)`,
  }
}

export function Select<T extends string | number = string>({
  id,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  className = '',
  showCheckmark = true,
  surfaceStyle = 'default',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const selectedOption = options.find((opt) => opt.value === value)
  const displayLabel = selectedOption?.label || placeholder || 'Select...'

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSelect = (optionValue: T) => {
    setIsOpen(false)
    if (optionValue !== value) {
      onChange(optionValue)
    }
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        onClick={() => setIsOpen((open) => !open)}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-ctp-text transition focus:outline-none focus:border-ctp-mauve disabled:opacity-60 bg-ctp-mantle border-ctp-surface1 hover:border-ctp-surface2"
        style={selectedOption ? getOptionSurfaceStyle(selectedOption, surfaceStyle) : undefined}
      >
        <span className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption?.colorVar && (
            <span
              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: `var(${selectedOption.colorVar})` }}
            />
          )}
          <span className={`truncate ${selectedOption?.textClass || ''}`}>{displayLabel}</span>
          {selectedOption?.metadata && (
            <span className="ml-auto flex-shrink-0">{selectedOption.metadata}</span>
          )}
        </span>
        <svg
          className={`h-4 w-4 text-ctp-subtext0 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute z-50 mt-2 w-full rounded-lg border border-ctp-surface1 bg-ctp-mantle shadow-lg p-2"
            role="listbox"
            aria-labelledby={id}
          >
            <div className="grid gap-2">
              {options.map((option) => {
                const isSelected = option.value === value
                const isDisabled = option.disabled || false

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled}
                    onClick={() => !isDisabled && handleSelect(option.value)}
                    disabled={isDisabled}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed min-w-0 ${
                      isSelected ? 'ring-1 ring-ctp-mauve' : ''
                    } ${surfaceStyle === 'default' ? 'border-ctp-surface1 bg-ctp-surface0 hover:bg-ctp-surface1' : ''}`}
                    style={surfaceStyle === 'status' ? getOptionSurfaceStyle(option, surfaceStyle) : undefined}
                  >
                    <span className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                      {option.colorVar && (
                        <span
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: `var(${option.colorVar})` }}
                        />
                      )}
                      <span className={`truncate ${option.textClass || ''}`}>{option.label}</span>
                      {option.metadata && (
                        <span className="flex-shrink-0 ml-1">{option.metadata}</span>
                      )}
                    </span>
                    {showCheckmark && isSelected && (
                      <svg
                        className="h-4 w-4 text-ctp-mauve flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
