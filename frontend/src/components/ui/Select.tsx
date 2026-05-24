import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  className?: string
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  disabled,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">{label}</label>
      )}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between rounded-lg border bg-surface-card px-3 py-2.5 text-sm transition-all',
            error
              ? 'border-red-500/50 focus:border-red-500'
              : 'border-surface-border hover:border-zinc-600 focus:border-brand-500',
            disabled && 'cursor-not-allowed opacity-50',
            open && 'border-brand-500 ring-1 ring-brand-500/20'
          )}
        >
          <span className={selected ? 'text-text-primary' : 'text-text-muted'}>
            {selected ? selected.label : placeholder}
          </span>
          <svg
            className={cn('h-4 w-4 text-text-muted transition-transform', open && 'rotate-180')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-surface-border bg-surface-card py-1 shadow-2xl shadow-black/50">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (!option.disabled) {
                    onChange(option.value)
                    setOpen(false)
                  }
                }}
                disabled={option.disabled}
                className={cn(
                  'flex w-full items-center px-3 py-2 text-sm transition-colors',
                  option.value === value
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                  option.disabled && 'cursor-not-allowed opacity-40'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
}
