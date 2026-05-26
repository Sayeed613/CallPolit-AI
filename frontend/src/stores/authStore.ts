import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  error: string | null
  rateLimited: boolean
  rateLimitCountdown: number
  rateLimitTimer: ReturnType<typeof setInterval> | null

  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string, companyName?: string, industry?: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  clearError: () => void
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,
  error: null,
  rateLimited: false,
  rateLimitCountdown: 0,
  rateLimitTimer: null,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({
        user: session?.user ?? null,
        session,
        initialized: true,
      })

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null, session })
      })
    } catch {
      set({ initialized: true })
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      set({ user: data.user, session: data.session, loading: false })
    } catch (err: unknown) {
      const error = err as any
      const message = error?.message || 'Failed to sign in. Please try again.'
      set({ error: message, loading: false })
    }
  },

  signUp: async (email: string, password: string, name?: string, companyName?: string, industry?: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      })
      if (error) throw error

      // Create company record (fire-and-forget — don't block signup on this)
      if (data.user && companyName) {
        const token = data.session?.access_token
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        fetch('/api/company/create', {
          method: 'POST',
          headers,
          body: JSON.stringify({ name: companyName, industry: industry || '' }),
        }).catch(() => {
          // Company creation is non-critical; user can set it up later
        })
      }

      set({ user: data.user, session: data.session, loading: false })
    } catch (err: unknown) {
      const error = err as any
      const status = error?.status
      const code = error?.code
      const message = error?.message || 'Failed to sign up'

      // Rate limit detection — check status (number) and code (string) separately
      if (
        status === 429 ||
        code === '429' ||
        code === 'over_email_send_rate_limit' ||
        message.includes('over_email_send_rate_limit') ||
        message.includes('rate_limit') ||
        message.includes('rate limit')
      ) {
        set({
          error: message,
          rateLimited: true,
          rateLimitCountdown: 60,
          loading: false,
        })

        // Start countdown
        const existingTimer = get().rateLimitTimer
        if (existingTimer) clearInterval(existingTimer)

        const timer = setInterval(() => {
          const current = get().rateLimitCountdown
          if (current <= 1) {
            clearInterval(timer)
            set({
              rateLimited: false,
              rateLimitCountdown: 0,
              rateLimitTimer: null,
            })
          } else {
            set({ rateLimitCountdown: current - 1 })
          }
        }, 1000)

        set({ rateLimitTimer: timer })
      } else {
        set({ error: message, loading: false })
      }
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      await supabase.auth.signOut()
      set({ user: null, session: null, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) throw error
      set({ loading: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email'
      set({ error: message, loading: false })
    }
  },

  updatePassword: async (password: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      set({ loading: false })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password'
      set({ error: message, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore
