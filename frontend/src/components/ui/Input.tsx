import { forwardRef, useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  suffix?: React.ReactNode
  inputSize?: 'sm' | 'md'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, icon, suffix, type, inputSize = 'md', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const autoId = useId()
    const inputId = props.id || `input-${autoId}`
    const isPassword = type === 'password'

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-xs font-medium text-ink-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            type={isPassword ? (showPassword ? 'text' : 'password') : type}
            className={cn(
              'w-full rounded-md border bg-white px-3 text-sm text-ink outline-none transition duration-100 placeholder:text-ink-3',
              inputSize === 'sm' ? 'h-[34px]' : 'h-[38px]',
              icon && 'pl-9',
              (suffix || isPassword) && 'pr-10',
              error ? 'border-danger' : 'border-border focus:border-brand-500 focus:shadow-focus',
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          {suffix && !isPassword && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3">{suffix}</span>}
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-ink-3">{helperText}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
