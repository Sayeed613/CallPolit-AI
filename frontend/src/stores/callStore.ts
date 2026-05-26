import { create } from 'zustand'
import { liveApi } from '../lib/api'

interface Call {
  id: string
  campaign_id: string
  contact_id?: string
  contact_phone: string
  contact_name: string
  status: string
  duration: number
  language: string
  sentiment_score: number
  verification_status: string
  transcript: { role: string; content: string }[]
  direction: string
  started_at?: string
  twilio_call_sid?: string
}

interface LiveStats {
  total_today: number
  connected_today: number
  active_calls: number
  active_campaigns: number
}

interface CampaignProgress {
  campaign_id: string
  processed: number
  total: number
  customer_name: string
  customer_phone: string
}

interface CallState {
  // Live calls
  activeCalls: Call[]
  stats: LiveStats | null
  campaignProgress: CampaignProgress | null
  loading: boolean
  error: string | null
  lastUpdated: number

  // Actions
  fetchActiveCalls: () => Promise<void>
  fetchStats: () => Promise<void>
  addCall: (call: Call) => void
  updateCall: (callId: string, data: Partial<Call>) => void
  removeCall: (callId: string) => void
  setCampaignProgress: (progress: CampaignProgress | null) => void
  handleWebSocketEvent: (type: string, data: any) => void
}

const useCallStore = create<CallState>((set, get) => ({
  // Live calls
  activeCalls: [],
  stats: null,
  campaignProgress: null,
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
    set((state) => ({
      activeCalls: [call, ...state.activeCalls],
      stats: state.stats
        ? { ...state.stats, active_calls: state.stats.active_calls + 1 }
        : state.stats,
    })),

  updateCall: (callId: string, data: Partial<Call>) =>
    set((state) => ({
      activeCalls: state.activeCalls.map((c) =>
        c.id === callId ? { ...c, ...data } : c
      ),
    })),

  removeCall: (callId: string) =>
    set((state) => ({
      activeCalls: state.activeCalls.filter((c) => c.id !== callId),
      stats: state.stats
        ? { ...state.stats, active_calls: Math.max(0, state.stats.active_calls - 1) }
        : state.stats,
    })),

  setCampaignProgress: (progress: CampaignProgress | null) =>
    set({ campaignProgress: progress }),

  handleWebSocketEvent: (type: string, data: any) => {
    const state = get()
    switch (type) {
      case 'call_state':
        // Merge or add the call to activeCalls
        if (data.final) {
          // Remove from active calls list
          set({
            activeCalls: state.activeCalls.filter(c => c.id !== data.call_sid && c.twilio_call_sid !== data.call_sid),
          })
        } else {
          // Add/update call
          const existingIdx = state.activeCalls.findIndex(
            c => c.id === data.call_sid || c.twilio_call_sid === data.call_sid
          )
          const callEntry: Call = {
            id: data.call_sid || data.contact_id || `ws-${Date.now()}`,
            campaign_id: data.campaign_id || '',
            contact_id: data.contact_id,
            contact_phone: data.contact_phone || '',
            contact_name: data.contact_name || 'Unknown',
            status: data.status || 'in-progress',
            duration: data.duration || 0,
            language: '',
            sentiment_score: data.sentiment_score || 0.5,
            verification_status: '',
            transcript: [],
            direction: data.direction || 'outbound',
            started_at: new Date().toISOString(),
          }
          if (existingIdx >= 0) {
            const updated = [...state.activeCalls]
            updated[existingIdx] = { ...updated[existingIdx], ...callEntry }
            set({ activeCalls: updated })
          } else {
            set({ activeCalls: [callEntry, ...state.activeCalls] })
          }
        }
        break

      case 'transcript':
        // Update transcript for the relevant call
        set({
          activeCalls: state.activeCalls.map(c => {
            if (c.id === data.call_sid || c.twilio_call_sid === data.call_sid) {
              const transcript = [...(c.transcript || []), {
                role: data.role === 'ai' ? 'assistant' : 'user',
                content: data.text,
              }]
              return {
                ...c,
                transcript,
                sentiment_score: data.sentiment_score || c.sentiment_score,
              }
            }
            return c
          }),
        })
        break

      case 'campaign_progress':
        set({ campaignProgress: data })
        break

      case 'campaign_state':
        // Campaign status changed
        set({ campaignProgress: data })
        break
    }
  },
}))

export default useCallStore
