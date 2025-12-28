import { ButtonHTMLAttributes, forwardRef } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const baseStyles = 'rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ctp-base disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variantStyles = {
      primary: 'bg-ctp-mauve text-ctp-base hover:bg-ctp-mauve/80 focus:ring-ctp-mauve shadow-lg shadow-ctp-mauve/20',
      secondary: 'bg-ctp-teal text-ctp-base hover:bg-ctp-teal/80 focus:ring-ctp-teal shadow-lg shadow-ctp-teal/20',
      ghost: 'bg-transparent text-ctp-subtext1 hover:bg-ctp-surface0 hover:text-ctp-text focus:ring-ctp-surface1',
      danger: 'bg-ctp-red text-ctp-base hover:bg-ctp-red/80 focus:ring-ctp-red shadow-lg shadow-ctp-red/20'
    }
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    }
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
