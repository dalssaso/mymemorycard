import { HTMLAttributes } from 'react'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'status' | 'platform' | 'genre'
  status?: 'backlog' | 'playing' | 'finished' | 'dropped' | 'completed'
}

export function Badge({ 
  variant = 'default', 
  status,
  className = '', 
  children,
  ...props 
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2 py-1 rounded text-xs font-medium'
  
  let variantStyles = ''
  
  if (variant === 'status' && status) {
    const statusStyles = {
      backlog: 'bg-gray-700/50 border border-gray-600 text-gray-400',
      playing: 'bg-primary-cyan/20 border border-primary-cyan rounded-lg text-primary-cyan',
      finished: 'bg-primary-green/20 border border-primary-green rounded-lg text-primary-green',
      dropped: 'bg-primary-red/20 border border-primary-red rounded-lg text-primary-red',
      completed: 'bg-primary-yellow/20 border border-primary-yellow rounded-lg text-primary-yellow'
    }
    variantStyles = statusStyles[status]
  } else if (variant === 'platform') {
    variantStyles = 'bg-primary-purple/20 border border-primary-purple rounded-lg text-primary-purple'
  } else if (variant === 'genre') {
    variantStyles = 'bg-primary-cyan/10 border border-primary-cyan/30 rounded text-primary-cyan'
  } else {
    variantStyles = 'bg-gray-800 text-gray-300'
  }
  
  return (
    <span
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
