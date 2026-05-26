import { useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart2,
  Calendar,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Phone,
  Radio,
  Settings2,
  Sparkles,
  Users,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import useAuthStore from '../../stores/authStore'
import useCallStore from '../../stores/callStore'
import useCompanyStore from '../../stores/companyStore'
import useUIStore from '../../stores/uiStore'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/live', label: 'Live Calls', icon: Radio, live: true },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/customers', label: 'Customers', icon: Users },
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

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-full flex-col border-r border-border bg-white transition-all duration-200 lg:flex',
        sidebarCollapsed ? 'w-14' : 'w-[220px]',
      )}
    >
      <div className={cn('flex h-14 items-center gap-3 px-4', sidebarCollapsed && 'justify-center px-0')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500">
          <Phone size={17} className="text-white" />
        </div>
        {!sidebarCollapsed && <span className="truncate text-sm font-medium text-ink">CallPilot</span>}
      </div>

      {!sidebarCollapsed && company && (
        <div className="border-t border-border px-3 py-3">
          <p className="truncate text-xs font-medium text-ink">{company.name}</p>
          <p className="truncate text-xs text-ink-3">{company.industry || 'General'}</p>
        </div>
      )}

      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={sidebarCollapsed ? item.label : undefined}
              className={cn(
                'relative flex h-10 w-full items-center gap-3 rounded px-2 text-sm transition-colors',
                sidebarCollapsed && 'justify-center',
                isActive ? 'bg-brand-50 text-brand-600' : 'text-ink-2 hover:bg-subtle',
              )}
            >
              {isActive && <span className="absolute left-0 top-2 h-6 w-0.5 rounded-full bg-brand-500" />}
              <span className="relative shrink-0">
                <Icon size={20} className={isActive ? 'text-brand-600' : 'text-ink-3'} />
                {item.live && activeCalls.length > 0 && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success pulse-dot" />}
              </span>
              {!sidebarCollapsed && <span className="truncate text-xs font-medium">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-border p-2">
        <button
          onClick={() => signOut()}
          className={cn('flex h-10 w-full items-center gap-3 rounded px-2 text-sm text-ink-2 hover:bg-subtle', sidebarCollapsed && 'justify-center')}
          title="Sign out"
        >
          <LogOut size={20} className="text-ink-3" />
          {!sidebarCollapsed && <span className="text-xs font-medium">Sign out</span>}
        </button>
      </div>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-white text-ink-3 shadow-card hover:text-ink-2 lg:flex"
      >
        <ChevronLeft size={14} className={cn('transition-transform', sidebarCollapsed && 'rotate-180')} />
      </button>
    </aside>
  )
}

export default Sidebar
