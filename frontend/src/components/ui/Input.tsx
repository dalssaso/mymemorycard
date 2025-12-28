import { InputHTMLAttributes, forwardRef } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-ctp-subtext0 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-ctp-mantle border ${
            error ? 'border-ctp-red' : 'border-ctp-surface1'
          } rounded-lg px-3 py-2 text-ctp-text placeholder-ctp-overlay1 focus:outline-none focus:border-ctp-mauve transition-colors ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-ctp-red">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
