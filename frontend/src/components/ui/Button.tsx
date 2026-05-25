import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xs'
  loading?: boolean
  icon?: React.ReactNode
}

const variants = {
  primary: 'border border-brand-500 bg-brand-500 text-white shadow-sm hover:bg-brand-600 active:bg-brand-700',
  secondary: 'border border-border bg-white text-ink hover:bg-subtle active:bg-canvas',
  ghost: 'border border-transparent bg-transparent text-ink-2 hover:bg-subtle active:bg-canvas',
  danger: 'border border-danger/20 bg-danger-bg text-danger hover:border-danger/40',
  outline: 'border border-border bg-white text-ink hover:bg-subtle active:bg-canvas',
}

const sizes = {
  xs: 'h-7 px-3 text-xs gap-1.5',
  sm: 'h-7 px-3 text-xs gap-1.5',
  md: 'h-8 px-3.5 text-sm gap-2',
  lg: 'h-9 px-4 text-base gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-100',
          'focus:outline-none focus:shadow-focus disabled:cursor-not-allowed disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : icon}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
export default Button
