import { useEffect, useRef, useCallback } from 'react'
import { useCallStore } from '../stores/callStore'

interface UseWebSocketOptions {
  companyId: string | null
  enabled?: boolean
}

export function useWebSocket({ companyId, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const { addActiveCall, updateActiveCall, removeActiveCall, setWsConnected } = useCallStore()

  const connect = useCallback(() => {
    if (!companyId || !enabled) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const url = `${protocol}//${host}/api/live/ws/${companyId}`

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => setWsConnected(true)

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          switch (data.type) {
            case 'call_start':
              addActiveCall(data.call)
              break
            case 'call_update':
              if (data.call?.call_sid) {
                updateActiveCall(data.call.call_sid, data.call)
              }
              break
            case 'call_end':
              removeActiveCall(data.call_sid)
              break
            case 'transcript':
              if (data.call_sid) {
                updateActiveCall(data.call_sid, {
                  transcript: data.text,
                  language: data.language,
                  sentiment: data.sentiment,
                })
              }
              break
          }
        } catch (e) {
          // ignore parse errors
        }
      }

      ws.onclose = () => {
        setWsConnected(false)
        wsRef.current = null
        // Reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 2000)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      // connection error, will retry
      reconnectTimeoutRef.current = setTimeout(connect, 2000)
    }
  }, [companyId, enabled, addActiveCall, updateActiveCall, removeActiveCall, setWsConnected])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])
}
