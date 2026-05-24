import { create } from 'zustand'
import { liveApi } from '../lib/api'

interface Call {
  id: string
  campaign_id: string
  contact_phone: string
  contact_name: string
  status: string
  duration: number
  language: string
  sentiment_score: number
  verification_status: string
  transcript: any[]
  started_at: string
  direction: string
}

interface CallState {
  activeCalls: Call[]
  stats: {
    total_today: number
    connected_today: number
    active_calls: number
    active_campaigns: number
  } | null
  loading: boolean
  error: string | null
  lastUpdated: number

  fetchActiveCalls: () => Promise<void>
  fetchStats: () => Promise<void>
  addCall: (call: Call) => void
  updateCall: (callId: string, data: Partial<Call>) => void
  removeCall: (callId: string) => void
}

const useCallStore = create<CallState>((set) => ({
  activeCalls: [],
  stats: null,
  loading: false,
  error: null,
  lastUpdated: 0,

  fetchActiveCalls: async () => {
    try {
      const data = await liveApi.calls()
      set({ activeCalls: data.calls || [], lastUpdated: Date.now() })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch calls'
      set({ error: message })
    }
  },

  fetchStats: async () => {
    try {
      const data = await liveApi.stats()
      set({ stats: data, lastUpdated: Date.now() })
    } catch {
      // silently fail
    }
  },

  addCall: (call: Call) =>
    set((state) => ({ activeCalls: [call, ...state.activeCalls] })),

  updateCall: (callId: string, data: Partial<Call>) =>
    set((state) => ({
      activeCalls: state.activeCalls.map((c) =>
        c.id === callId ? { ...c, ...data } : c
      ),
    })),

  removeCall: (callId: string) =>
    set((state) => ({
      activeCalls: state.activeCalls.filter((c) => c.id !== callId),
    })),
}))

export default useCallStore
