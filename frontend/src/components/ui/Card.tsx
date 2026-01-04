import { type HTMLAttributes, type ReactNode } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
}

export function Card({ children, hover = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-ctp-surface0/30 rounded-lg p-4 border border-ctp-surface1/50 ${
        hover
          ? 'hover:bg-ctp-surface0/50 hover:border-ctp-surface2 transition-all cursor-pointer'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
