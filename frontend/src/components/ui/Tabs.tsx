import React from 'react'
import { cn } from '../../lib/utils'

interface Tab {
  id: string
  label: string
  badge?: number
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 rounded-lg bg-surface-secondary p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !tab.disabled && onChange(tab.id)}
          disabled={tab.disabled}
          className={cn(
            'relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
            activeTab === tab.id
              ? 'bg-surface-card text-text-primary shadow-sm'
              : 'text-text-muted hover:text-text-secondary',
            tab.disabled && 'cursor-not-allowed opacity-40'
          )}
        >
          {tab.label}
          {tab.badge !== undefined && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500/20 px-1.5 text-[11px] font-semibold text-brand-400">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
