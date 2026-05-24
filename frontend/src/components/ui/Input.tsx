import React from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helpText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-zinc-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 bg-surface-card border text-white placeholder-zinc-500 rounded-button transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'border-error/50 focus:ring-error/30 focus:border-error' : 'border-surface-border',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-error">{error}</p>}
        {helpText && !error && <p className="text-xs text-zinc-500">{helpText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
