import { cn } from '../../lib/utils'

interface ProgressProps {
  value: number
  max?: number
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  className?: string
}

const variantStyles = {
  default: 'bg-brand-500',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

export function Progress({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel,
  label,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-text-secondary">{label}</span>}
          {showLabel && <span className="text-xs text-text-tertiary">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-bg-overlay rounded-full overflow-hidden', sizeStyles[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            variantStyles[variant],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default Progress
