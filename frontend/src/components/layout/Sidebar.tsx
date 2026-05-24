import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  Radio,
  Megaphone,
  Users,
  BarChart2,
  FileText,
  Calendar,
  Settings2,
  ChevronLeft,
  Phone,
  LogOut,
  Bell,
  ChevronDown,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import useUIStore from '../../stores/uiStore'
import useAuthStore from '../../stores/authStore'
import useCompanyStore from '../../stores/companyStore'
import useCallStore from '../../stores/callStore'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/live', label: 'Live Calls', icon: Radio, live: true },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/contacts', label: 'Contacts', icon: Users },
  { path: '/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/appointments', label: 'Appointments', icon: Calendar },
  { path: '/settings', label: 'Settings', icon: Settings2 },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { signOut } = useAuthStore()
  const { company } = useCompanyStore()
  const { activeCalls } = useCallStore()

  const activeCallsCount = activeCalls.length

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-bg-surface border-r border-border-subtle z-40 flex flex-col transition-all duration-200',
        sidebarCollapsed ? 'w-14' : 'w-64',
      )}
      style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-14 border-b border-border-subtle px-4', sidebarCollapsed && 'justify-center')}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
            <Phone size={16} className="text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-semibold text-text-primary whitespace-nowrap overflow-hidden"
              >
                CallPilot
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Company */}
      {!sidebarCollapsed && company && (
        <div className="px-3 py-3 border-b border-border-subtle">
          <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-bg-elevated transition-colors text-left">
            <div className="w-6 h-6 rounded-md bg-brand-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-brand-400">{company.name[0]}</span>
            </div>
            <span className="text-xs font-medium text-text-primary truncate flex-1">{company.name}</span>
            <ChevronDown size={12} className="text-text-tertiary" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'relative flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-all duration-150',
                sidebarCollapsed ? 'justify-center' : 'px-4',
                isActive
                  ? 'text-brand-400 bg-brand-500/8'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated',
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-400 rounded-full"
                />
              )}
              <div className="relative flex-shrink-0">
                <Icon size={18} />
                {item.live && activeCallsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full pulse-dot" />
                )}
              </div>
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              {item.live && activeCallsCount > 0 && !sidebarCollapsed && (
                <span className="ml-auto text-xs text-success font-medium">{activeCallsCount}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className={cn('border-t border-border-subtle py-3', sidebarCollapsed ? 'px-2' : 'px-3')}>
        {!sidebarCollapsed && (
          <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated transition-colors">
            <Bell size={16} />
            <span>Notifications</span>
          </button>
        )}
        <button
          onClick={() => signOut()}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-text-tertiary hover:text-error hover:bg-error/5 transition-colors',
            sidebarCollapsed && 'justify-center',
          )}
          title="Sign out"
        >
          <LogOut size={16} />
          {!sidebarCollapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-bg-card border border-border-default rounded-full flex items-center justify-center hover:bg-bg-elevated transition-colors z-10',
          'hidden md:flex',
        )}
      >
        <ChevronLeft
          size={14}
          className={cn('text-text-tertiary transition-transform duration-200', sidebarCollapsed && 'rotate-180')}
        />
      </button>
    </aside>
  )
}

export default Sidebar
