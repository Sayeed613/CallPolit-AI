import { forwardRef, useId } from 'react'
import { cn } from '../../lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, value, id, ...props }, ref) => {
    const autoId = useId()
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}-${autoId}` : `select-${autoId}`)

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            value={value}
            className={cn(
              'w-full appearance-none bg-bg-surface text-text-primary border rounded-lg px-3 py-2.5 pr-10 text-sm',
              'transition-all duration-150 outline-none',
              error
                ? 'border-error'
                : 'border-border-default hover:border-border-strong focus:border-brand-500/50',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              className,
            )}
            {...props}
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        </div>
        {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
export default Select
