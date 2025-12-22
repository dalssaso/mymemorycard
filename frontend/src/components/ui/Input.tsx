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
          <label className="block text-sm font-medium text-gray-400 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-gray-900 border ${
            error ? 'border-primary-red' : 'border-gray-700'
          } rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-purple transition-colors ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-primary-red">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
