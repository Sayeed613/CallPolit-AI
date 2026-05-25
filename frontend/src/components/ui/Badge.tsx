import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'error' | 'brand' | 'neutral' | 'purple'
  size?: 'sm' | 'md'
  dot?: boolean
  pulse?: boolean
  className?: string
}

const variantStyles = {
  default: 'bg-canvas text-ink-2',
  neutral: 'bg-subtle text-ink-2',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  error: 'bg-danger-bg text-danger',
  brand: 'bg-brand-50 text-brand-700',
  purple: 'bg-brand-50 text-brand-700',
}

const dotColors = {
  default: 'bg-ink-3',
  neutral: 'bg-ink-3',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  error: 'bg-danger',
  brand: 'bg-brand-500',
  purple: 'bg-brand-500',
}

export function Badge({ children, variant = 'default', size = 'sm', dot, pulse, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 font-medium',
        size === 'sm' ? 'h-5 text-xs' : 'h-6 text-xs',
        variantStyles[variant],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant], pulse && 'animate-pulse-dot')} />}
      {children}
    </span>
  )
}

export default Badge
