import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import useAuthStore from './stores/authStore'
import useCompanyStore from './stores/companyStore'
import PageWrapper from './components/layout/PageWrapper'

// Lazy load pages
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const TOS = lazy(() => import('./pages/TOS'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const LiveDashboard = lazy(() => import('./pages/live/LiveDashboard'))
const CampaignsTab = lazy(() => import('./pages/CampaignsTab'))
const CampaignDetail = lazy(() => import('./pages/campaigns/CampaignDetail'))
const NewCampaign = lazy(() => import('./pages/NewCampaign'))
const ContactsTab = lazy(() => import('./pages/ContactsTab'))
const ContactDetail = lazy(() => import('./pages/ContactDetail'))
const ImportContacts = lazy(() => import('./pages/ImportContacts'))
const AnalyticsTab = lazy(() => import('./pages/AnalyticsTab'))
const DocumentsTab = lazy(() => import('./pages/DocumentsTab'))
const AppointmentsTab = lazy(() => import('./pages/AppointmentsTab'))
const CompanyPage = lazy(() => import('./pages/CompanyPage'))
const Settings = lazy(() => import('./pages/settings/Settings'))

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-sm text-ink-3">Loading...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuthStore()

  if (!initialized || loading) {
    return <LoadingFallback />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

function AppContent() {
  const location = useLocation()
  const { initialize, initialized, loading, user } = useAuthStore()
  const { fetchCompany } = useCompanyStore()

  useEffect(() => {
    if (!initialized) {
      initialize()
    }
  }, [initialize, initialized])

  useEffect(() => {
    if (user) {
      fetchCompany()
    }
  }, [user, fetchCompany])

  if (!initialized || loading) {
    return <LoadingFallback />
  }

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingFallback />}>
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/tos" element={<TOS />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="/live" element={<ProtectedRoute><PageWrapper><LiveDashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="/campaigns" element={<ProtectedRoute><PageWrapper><CampaignsTab /></PageWrapper></ProtectedRoute>} />
          <Route path="/campaigns/new" element={<ProtectedRoute><PageWrapper><NewCampaign /></PageWrapper></ProtectedRoute>} />
          <Route path="/campaigns/:id" element={<ProtectedRoute><PageWrapper><CampaignDetail /></PageWrapper></ProtectedRoute>} />
          <Route path="/contacts" element={<ProtectedRoute><PageWrapper><ContactsTab /></PageWrapper></ProtectedRoute>} />
          <Route path="/contacts/import" element={<ProtectedRoute><PageWrapper><ImportContacts /></PageWrapper></ProtectedRoute>} />
          <Route path="/contacts/:id" element={<ProtectedRoute><PageWrapper><ContactDetail /></PageWrapper></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><PageWrapper><AnalyticsTab /></PageWrapper></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><PageWrapper><DocumentsTab /></PageWrapper></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute><PageWrapper><AppointmentsTab /></PageWrapper></ProtectedRoute>} />
          <Route path="/company" element={<ProtectedRoute><PageWrapper><CompanyPage /></PageWrapper></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><PageWrapper><Settings /></PageWrapper></ProtectedRoute>} />
          <Route path="/settings/:tab" element={<ProtectedRoute><PageWrapper><Settings /></PageWrapper></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}

export default function App() {
  return <AppContent />
}
