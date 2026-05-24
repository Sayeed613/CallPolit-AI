import { cn } from '../../lib/utils'

interface Tab {
  value: string
  label: string
  count?: number
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (value: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 p-1 bg-bg-surface rounded-lg border border-border-default', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
            activeTab === tab.value
              ? 'bg-bg-elevated text-text-primary shadow-sm'
              : 'text-text-tertiary hover:text-text-secondary',
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded-full',
              activeTab === tab.value
                ? 'bg-brand-500/20 text-brand-400'
                : 'bg-bg-overlay text-text-tertiary',
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export default Tabs
