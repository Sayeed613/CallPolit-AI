import { useCallStore, type LiveCall } from '../stores/callStore'

type EventHandler = (data: unknown) => void

export class CallPilotWebSocket {
  private ws: WebSocket | null = null
  private companyId: string = ''
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private handlers: Map<string, EventHandler[]> = new Map()
  private shouldReconnect = true
  private pingInterval: ReturnType<typeof setInterval> | null = null

  connect(companyId: string) {
    this.companyId = companyId
    this.shouldReconnect = true
    this._connect()
  }

  private _connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const url = `${protocol}//${host}/api/live/ws/${this.companyId}`

    try {
      this.ws = new WebSocket(url)
    } catch {
      this._scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      useCallStore.getState().setWsConnected(true)
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = null
      }
      // Send ping every 30 seconds to keep connection alive
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send('ping')
        }
      }, 30000)
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this._emit(data.type, data.payload)
        this._handleEvent(data.type, data)
      } catch {
        // Ignore malformed messages
      }
    }

    this.ws.onclose = () => {
      useCallStore.getState().setWsConnected(false)
      if (this.pingInterval) {
        clearInterval(this.pingInterval)
        this.pingInterval = null
      }
      if (this.shouldReconnect) {
        this._scheduleReconnect()
      }
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  private _scheduleReconnect() {
    this.reconnectTimeout = setTimeout(() => this._connect(), 3000)
  }

  private _handleEvent(type: string, data: { payload: LiveCall }) {
    const store = useCallStore.getState()
    switch (type) {
      case 'call_start':
        store.addActiveCall(data.payload)
        break
      case 'call_update':
        store.updateActiveCall(data.payload.call_sid, data.payload)
        break
      case 'call_end':
        store.removeActiveCall(data.payload.call_sid)
        break
      case 'transcript':
        store.updateActiveCall(data.payload.call_sid, {
          transcript: (data.payload as any).text || data.payload.transcript,
        })
        break
    }
  }

  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event)!.push(handler)
    return () => this.off(event, handler)
  }

  off(event: string, handler: EventHandler) {
    const handlers = this.handlers.get(event)
    if (handlers) {
      this.handlers.set(event, handlers.filter((h) => h !== handler))
    }
  }

  private _emit(event: string, data: unknown) {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.forEach((h) => h(data))
    }
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
    this.ws?.close()
    this.ws = null
    useCallStore.getState().setWsConnected(false)
  }
}

let _instance: CallPilotWebSocket | null = null

export function getWebSocket(): CallPilotWebSocket {
  if (!_instance) {
    _instance = new CallPilotWebSocket()
  }
  return _instance
}
