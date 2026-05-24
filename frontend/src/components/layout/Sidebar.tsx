import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Radio, Megaphone, Users, BarChart3, FileText,
  Calendar, Settings, ChevronLeft, Phone, LogOut, Bell,
  Menu,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'
import { useCompanyStore } from '../../stores/companyStore'
import { useCallStore } from '../../stores/callStore'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Live Calls', path: '/live', icon: Radio, badge: true },
  { label: 'Campaigns', path: '/campaigns', icon: Megaphone },
  { label: 'Contacts', path: '/contacts', icon: Users },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Documents', path: '/documents', icon: FileText },
  { label: 'Appointments', path: '/appointments', icon: Calendar },
  { label: 'Settings', path: '/settings', icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const [showMobile, setShowMobile] = useState(false)
  const { signOut } = useAuthStore()
  const { activeCompany } = useCompanyStore()
  const { activeCalls } = useCallStore()

  const handleSignOut = () => {
    signOut()
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-5 border-b border-surface-border', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white">CallPilot</span>
              <span className="text-[10px] font-medium text-brand-400 block -mt-0.5">AI</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
            <Phone className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-surface-hover transition-colors',
            collapsed && 'hidden'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Company name */}
      {!collapsed && activeCompany && (
        <div className="px-5 py-3 border-b border-surface-border">
          <p className="text-xs text-zinc-500">Company</p>
          <p className="text-sm font-medium text-white truncate">{activeCompany.name}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onMobileClose?.()}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-surface-hover border border-transparent',
                  collapsed && 'justify-center px-2'
                )
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && activeCalls.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full animate-ping-slow" />
                )}
              </div>
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && activeCalls.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-success" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className={cn('px-3 py-4 border-t border-surface-border space-y-1', collapsed && 'flex flex-col items-center')}>
        <button className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-surface-hover transition-colors w-full',
          collapsed && 'justify-center px-2'
        )}>
          <Bell className="w-5 h-5" />
          {!collapsed && <span>Notifications</span>}
        </button>
        <button
          onClick={handleSignOut}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-error hover:bg-error/10 transition-colors w-full',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed left-0 top-0 h-full bg-surface-secondary border-r border-surface-border z-30 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => onMobileClose?.()}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 h-full w-64 bg-surface-secondary border-r border-surface-border z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
