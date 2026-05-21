import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, Building2, LogOut, Menu, X, Phone, BarChart3
} from 'lucide-react'

interface Company {
  id: string
  name: string
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || ''))
  }, [])

  // Extract company ID from URL if on a company page
  const companyMatch = location.pathname.match(/\/company\/([^/]+)/)
  const activeCompanyId = companyMatch?.[1] || null

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  ]

  if (activeCompanyId) {
    navItems.push(
      { path: `/company/${activeCompanyId}`, icon: Building2, label: 'Overview' },
      { path: `/company/${activeCompanyId}?tab=analytics`, icon: BarChart3, label: 'Analytics' },
      { path: `/company/${activeCompanyId}?tab=campaigns`, icon: Phone, label: 'Campaigns' },
    )
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">CallPilot</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1"><X className="w-5 h-5" /></button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2 truncate">{userEmail}</div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <button onClick={() => setSidebarOpen(true)} className="p-1"><Menu className="w-6 h-6" /></button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold">CallPilot</span>
          </Link>
          <div className="w-8" />
        </div>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
