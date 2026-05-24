import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

const variants = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 hover:scale-[1.01]',
  secondary:
    'bg-bg-elevated border border-border-default text-text-primary hover:bg-bg-overlay active:bg-bg-elevated',
  ghost:
    'bg-transparent text-text-secondary hover:bg-bg-elevated active:bg-bg-overlay',
  danger:
    'bg-error/10 text-error border border-error/20 hover:bg-error/20 active:bg-error/30',
  outline:
    'bg-transparent border border-border-strong text-text-primary hover:bg-bg-elevated active:bg-bg-overlay',
}

const sizes = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-2.5 text-base gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, icon, children, ...props }, ref) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'relative inline-flex items-center justify-center font-medium rounded-button transition-all duration-150 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1 focus:ring-offset-bg-base',
          variants[variant],
          sizes[size],
          isDisabled && 'opacity-40 cursor-not-allowed hover:scale-100',
          className,
        )}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
export default Button
