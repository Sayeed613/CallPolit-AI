import React from 'react'
import { cn } from '../../lib/utils'

interface PageWrapperProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function PageWrapper({ children, title, subtitle, actions, className }: PageWrapperProps) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-6 py-8', className)}>
      {(title || actions) && (
        <div className="mb-8 flex items-start justify-between">
          <div>
            {title && (
              <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
