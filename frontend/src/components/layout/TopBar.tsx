import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Bell, ChevronDown, Menu } from 'lucide-react'
import { cn } from '../../lib/utils'
import useUIStore from '../../stores/uiStore'
import useAuthStore from '../../stores/authStore'
import useCompanyStore from '../../stores/companyStore'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/live': 'Live Calls',
  '/campaigns': 'Campaigns',
  '/contacts': 'Contacts',
  '/analytics': 'Analytics',
  '/documents': 'Documents',
  '/appointments': 'Appointments',
  '/settings': 'Settings',
  '/company': 'Company',
}

export function TopBar() {
  const location = useLocation()
  const { toggleMobileNav } = useUIStore()
  const { user } = useAuthStore()
  const { company } = useCompanyStore()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const currentPage = pageTitles[location.pathname] || 'Dashboard'

  return (
    <header className="sticky top-0 z-30 h-14 bg-bg-base/80 backdrop-blur-xl border-b border-border-subtle">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left */}
        <div className="flex items-center gap-4">
          {/* Mobile menu */}
          <button onClick={toggleMobileNav} className="lg:hidden p-2 text-text-tertiary hover:text-text-primary">
            <Menu size={20} />
          </button>

          {/* Page title + breadcrumb */}
          <div>
            <h1 className="text-sm font-semibold text-text-primary">{currentPage}</h1>
            <p className="text-xs text-text-tertiary">
              {company?.name || 'CallPilot AI'}
              <span className="mx-1.5">·</span>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search... (Cmd+K)"
              className="w-full bg-bg-surface border border-border-default rounded-lg pl-9 pr-3 py-1.5 text-sm text-text-primary placeholder-text-disabled outline-none focus:border-brand-500/50 transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary bg-bg-elevated px-1.5 py-0.5 rounded border border-border-default">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-bg-elevated transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-error rounded-full" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-elevated transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <ChevronDown size={14} className="text-text-tertiary hidden sm:block" />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-bg-card border border-border-default rounded-lg shadow-elevated z-20 py-1"
                >
                  <div className="px-3 py-2 border-b border-border-subtle">
                    <p className="text-sm text-text-primary truncate">{user?.email}</p>
                  </div>
                  <button className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors">
                    Profile
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors">
                    Settings
                  </button>
                  <div className="border-t border-border-subtle mt-1 pt-1">
                    <button className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error/5 transition-colors">
                      Sign out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopBar
