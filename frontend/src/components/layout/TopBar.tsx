import React from 'react'
import { Menu, Bell, Search } from 'lucide-react'
import { cn, getInitials } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'

interface TopBarProps {
  title?: string
  onMenuClick?: () => void
}

export function TopBar({ title, onMenuClick }: TopBarProps) {
  const { user } = useAuthStore()

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 lg:px-6 bg-surface/80 backdrop-blur-xl border-b border-surface-border">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick || (() => {})}
          className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-hover transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <button className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-hover transition-colors hidden sm:flex">
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-hover transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-surface-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-xs font-semibold text-white">
            {getInitials(user?.user_metadata?.full_name || user?.email || 'U')}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white leading-tight">
              {user?.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-xs text-zinc-500">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
