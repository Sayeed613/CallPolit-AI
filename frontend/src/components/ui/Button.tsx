import React from 'react'
import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-button'

  const variants = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 hover:scale-[1.02]',
    secondary: 'bg-surface-card text-white border border-surface-border hover:bg-surface-hover hover:border-brand-500/30 active:bg-surface-card',
    ghost: 'text-zinc-400 hover:text-white hover:bg-surface-card active:bg-surface-hover',
    danger: 'bg-error text-white hover:bg-error-dark active:bg-error shadow-lg shadow-error/20',
    success: 'bg-success text-white hover:bg-success-dark active:bg-success shadow-lg shadow-success/20',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon || null}
      {children}
    </button>
  )
}
