import { create } from 'zustand'

import type { LiveCall as ApiLiveCall } from '../lib/api'

// Re-export to ensure type consistency with API response
export type LiveCall = ApiLiveCall

interface CallState {
  activeCalls: LiveCall[]
  recentCalls: LiveCall[]
  loading: boolean
  wsConnected: boolean
  fetchActiveCalls: (companyId: string) => Promise<void>
  addActiveCall: (call: LiveCall) => void
  updateActiveCall: (callSid: string, updates: Partial<LiveCall>) => void
  removeActiveCall: (callSid: string) => void
  setWsConnected: (connected: boolean) => void
}

export const useCallStore = create<CallState>((set, get) => ({
  activeCalls: [],
  recentCalls: [],
  loading: false,
  wsConnected: false,

  fetchActiveCalls: async (companyId) => {
    set({ loading: true })
    try {
      const { api } = await import('../lib/api')
      const data = await api.live.getActiveCalls(companyId)
      set({ activeCalls: data.calls || [] })
    } catch {
      // Silently fail
    } finally {
      set({ loading: false })
    }
  },

  addActiveCall: (call) => {
    set((state) => ({ activeCalls: [...state.activeCalls, call] }))
  },

  updateActiveCall: (callSid, updates) => {
    set((state) => ({
      activeCalls: state.activeCalls.map((c) =>
        c.call_sid === callSid ? { ...c, ...updates } : c
      ),
    }))
  },

  removeActiveCall: (callSid) => {
    set((state) => {
      const call = state.activeCalls.find((c) => c.call_sid === callSid)
      const remaining = state.activeCalls.filter((c) => c.call_sid !== callSid)
      return {
        activeCalls: remaining,
        recentCalls: call
          ? [call, ...state.recentCalls].slice(0, 50)
          : state.recentCalls,
      }
    })
  },

  setWsConnected: (connected) => set({ wsConnected: connected }),
}))
