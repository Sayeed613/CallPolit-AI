import React from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'brand' | 'default'
  className?: string
  dot?: boolean
  pulsing?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Badge({ children, variant = 'neutral', className, dot = false, pulsing = false, size }: BadgeProps) {
  const variants: Record<string, string> = {
    success: 'bg-success/10 text-success-light border-success/20',
    warning: 'bg-warning/10 text-warning-light border-warning/20',
    error: 'bg-error/10 text-error-light border-error/20',
    info: 'bg-brand-500/10 text-brand-300 border-brand-500/20',
    neutral: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    brand: 'bg-brand-500/10 text-brand-300 border-brand-500/20',
    default: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  }

  const dotColors: Record<string, string> = {
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-brand-400',
    neutral: 'bg-zinc-400',
    brand: 'bg-brand-400',
    default: 'bg-zinc-400',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border',
        size === 'sm' && 'px-2 py-0 text-[10px]',
        variants[variant] || variants.neutral,
        className
      )}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          dotColors[variant],
          pulsing && 'animate-ping-slow'
        )} />
      )}
      {children}
    </span>
  )
}
