import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'brand' | 'purple'
  size?: 'sm' | 'md'
  dot?: boolean
  pulse?: boolean
  className?: string
}

const variantStyles = {
  default: 'bg-bg-elevated text-text-secondary border border-border-default',
  success: 'bg-success-muted text-success border border-success/20',
  warning: 'bg-warning-muted text-warning border border-warning/20',
  error: 'bg-error-muted text-error border border-error/20',
  brand: 'bg-brand-500/10 text-brand-400 border border-brand-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
}

const dotColors = {
  default: 'bg-text-tertiary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  brand: 'bg-brand-400',
  purple: 'bg-purple-400',
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot,
  pulse,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        variantStyles[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            dotColors[variant],
            pulse && 'pulse-dot',
          )}
        />
      )}
      {children}
    </span>
  )
}

export default Badge
