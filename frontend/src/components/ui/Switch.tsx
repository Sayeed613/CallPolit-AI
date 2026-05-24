import { cn } from '../../lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

export function Switch({ checked, onChange, label, disabled, className }: SwitchProps) {
  return (
    <label className={cn('inline-flex items-center gap-3 cursor-pointer', disabled && 'opacity-40 cursor-not-allowed', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:ring-offset-1 focus:ring-offset-bg-base',
          checked ? 'bg-brand-500' : 'bg-bg-overlay',
        )}
      >
        <span
          className={cn(
            'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow-sm',
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]',
          )}
        />
      </button>
      {label && <span className="text-sm text-text-primary">{label}</span>}
    </label>
  )
}

export default Switch
