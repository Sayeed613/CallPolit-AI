import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Radio, Megaphone, Users, Settings2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import useCallStore from '../../stores/callStore'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/live', label: 'Live', icon: Radio, live: true },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/contacts', label: 'Contacts', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings2 },
]

export function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeCalls } = useCallStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-bg-card border-t border-border-default safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-0',
                isActive ? 'text-brand-400' : 'text-text-tertiary',
              )}
            >
              <div className="relative">
                <Icon size={20} />
                {item.live && activeCalls.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full pulse-dot" />
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-400 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileNav
