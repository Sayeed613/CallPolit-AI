import { forwardRef, useState, useId } from 'react'
import { cn } from '../../lib/utils'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  suffix?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, icon, suffix, type, value, onChange, placeholder, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [focused, setFocused] = useState(false)
    const autoId = useId()
    const inputId = props.id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}-${autoId}` : `input-${autoId}`)

    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type
    const hasValue = value !== undefined && value !== '' && value !== null
    const isFloating = focused || hasValue

    return (
      <div className="w-full">
        <div
          className={cn(
            'relative flex items-center rounded-lg border transition-all duration-150',
            error
              ? 'border-error bg-error/5'
              : focused
                ? 'border-brand-500/50 bg-bg-surface'
                : 'border-border-default bg-bg-surface hover:border-border-strong',
            className,
          )}
        >
          {icon && (
            <span className="pl-3 text-text-tertiary flex-shrink-0">{icon}</span>
          )}

          <div className="relative flex-1">
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  'absolute left-3 transition-all duration-150 pointer-events-none',
                  isFloating
                    ? '-top-2.5 text-xs text-brand-400 bg-bg-surface px-1'
                    : 'top-1/2 -translate-y-1/2 text-sm text-text-tertiary',
                )}
              >
                {label}
              </label>
            )}
            <input
              ref={ref}
              id={inputId}
              type={inputType}
              value={value}
              onChange={onChange}
              placeholder={isFloating ? placeholder : (label ? '' : placeholder)}
              autoComplete={props.autoComplete || (type === 'password' ? 'current-password' : type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'off')}
              onFocus={(e) => {
                setFocused(true)
                props.onFocus?.(e)
              }}
              onBlur={(e) => {
                setFocused(false)
                props.onBlur?.(e)
              }}
              className={cn(
                'w-full bg-transparent text-text-primary placeholder-text-disabled outline-none',
                'px-3 py-2.5 text-sm',
                label && (isFloating ? 'pt-3.5 pb-1.5' : 'py-2.5'),
                icon && 'pl-0',
                isPassword && 'pr-10',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}
              {...props}
            />
          </div>

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="pr-3 text-text-tertiary hover:text-text-secondary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}

          {suffix && !isPassword && (
            <span className="pr-3 text-text-tertiary flex-shrink-0">{suffix}</span>
          )}
        </div>

        {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-xs text-text-tertiary">{helperText}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
