import { useEffect, useCallback, useRef } from 'react'
import { wsManager } from '../lib/websocket'

export function useWebSocket(
  url: string,
  handlers: Record<string, (data: any) => void> = {},
  deps: any[] = [],
) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    wsManager.connect(url)

    const unsubscribers = Object.entries(handlersRef.current).map(([event, handler]) =>
      wsManager.on(event, handler),
    )

    return () => {
      unsubscribers.forEach((unsub) => unsub())
      wsManager.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps])

  const send = useCallback((data: Record<string, any>) => {
    wsManager.send(data)
  }, [])

  return {
    send,
    connected: wsManager.connected,
  }
}

export default useWebSocket
