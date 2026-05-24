import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'

const navItems = [
  { path: '/dashboard', icon: '◻', label: 'Dashboard' },
  { path: '/live', icon: '◉', label: 'Live' },
  { path: '/campaigns', icon: '⌂', label: 'Campaigns' },
  { path: '/contacts', icon: '☰', label: 'Contacts' },
  { path: '/settings', icon: '⚙', label: 'Settings' },
]

export function MobileNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-border bg-surface/95 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors',
                isActive ? 'text-brand-400' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
