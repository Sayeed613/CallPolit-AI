import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'
import { useCompanyStore } from './stores/companyStore'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { MobileNav } from './components/layout/MobileNav'
import { LandingPage } from './components/LandingPage'
import { Login } from './pages/Login'
import { Register } from './pages/Signup'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { TOS } from './pages/TOS'
import { Dashboard } from './pages/Dashboard'
import { LiveDashboard } from './pages/live/LiveDashboard'
import { CampaignsTab } from './pages/CampaignsTab'
import { CampaignDetail } from './pages/campaigns/CampaignDetail'
import { NewCampaign } from './pages/NewCampaign'
import { ContactsTab } from './pages/ContactsTab'
import { ImportContacts } from './pages/ImportContacts'
import { AnalyticsTab } from './pages/AnalyticsTab'
import { DocumentsTab } from './pages/DocumentsTab'
import { Settings } from './pages/settings/Settings'
import { AppointmentsTab } from './pages/AppointmentsTab'
import { CompanyPage } from './pages/CompanyPage'
import { ContactDetail } from './pages/ContactDetail'

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface">
          <div className="text-center">
            <span className="mb-4 block text-6xl">⚠️</span>
            <h1 className="mb-2 text-2xl font-bold text-text-primary">Something went wrong</h1>
            <p className="mb-6 text-text-muted">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
              className="rounded-lg bg-brand-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-brand-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, session, loading, initialize } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login', { replace: true })
    }
  }, [loading, session, navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return <>{children}</>
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`flex flex-1 flex-col transition-all ${sidebarCollapsed ? 'ml-16' : 'ml-72'}`}>
        <TopBar />
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
            },
            success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#1a1a1a' } },
            error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#1a1a1a' } },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/tos" element={<TOS />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/live"
            element={
              <AuthGuard>
                <AppLayout>
                  <LiveDashboard />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/campaigns"
            element={
              <AuthGuard>
                <AppLayout>
                  <CampaignsTab />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/campaigns/new"
            element={
              <AuthGuard>
                <AppLayout>
                  <NewCampaign />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/campaigns/:id"
            element={
              <AuthGuard>
                <AppLayout>
                  <CampaignDetail />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/contacts"
            element={
              <AuthGuard>
                <AppLayout>
                  <ContactsTab />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/contacts/import"
            element={
              <AuthGuard>
                <AppLayout>
                  <ImportContacts />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/contacts/:id"
            element={
              <AuthGuard>
                <AppLayout>
                  <ContactDetail />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/analytics"
            element={
              <AuthGuard>
                <AppLayout>
                  <AnalyticsTab />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/documents"
            element={
              <AuthGuard>
                <AppLayout>
                  <DocumentsTab />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/appointments"
            element={
              <AuthGuard>
                <AppLayout>
                  <AppointmentsTab />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <AuthGuard>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/settings/:tab"
            element={
              <AuthGuard>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/company"
            element={
              <AuthGuard>
                <AppLayout>
                  <CompanyPage />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/company/:id"
            element={
              <AuthGuard>
                <AppLayout>
                  <CompanyPage />
                </AppLayout>
              </AuthGuard>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}
