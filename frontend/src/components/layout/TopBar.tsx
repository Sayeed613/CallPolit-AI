import { useLocation } from 'react-router-dom'
import { Bell, Menu } from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import useCompanyStore from '../../stores/companyStore'
import useUIStore from '../../stores/uiStore'

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
  const currentPage = pageTitles[location.pathname] || pageTitles[`/${location.pathname.split('/')[1]}`] || 'Dashboard'
  const initials = user?.email?.slice(0, 1).toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-white">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button onClick={toggleMobileNav} className="rounded-md p-2 text-ink-3 hover:bg-subtle lg:hidden">
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-lg font-medium text-ink">{currentPage}</h1>
            <p className="text-sm text-ink-3">{company?.name || 'CallPilot'} / {currentPage}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-md p-2 text-ink-3 hover:bg-subtle" title="Notifications">
            <Bell size={20} />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopBar
