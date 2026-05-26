type MessageHandler = (data: any) => void

class WebSocketManager {
  private ws: WebSocket | null = null
  private url: string = ''
  private handlers: Map<string, Set<MessageHandler>> = new Map()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private isConnected: boolean = false
  private shouldReconnect: boolean = true
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 10

  connect(url: string) {
    this.url = url
    this.shouldReconnect = true
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING) {
      this.reconnectAttempts = 0
      this._connect()
    }
  }

  private _connect() {
    if (this.ws) {
      this.ws.close()
    }

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('_connected', null)
      }

      this.ws.onclose = () => {
        this.isConnected = false
        this.emit('_disconnected', null)
        this._scheduleReconnect()
      }

      this.ws.onerror = () => {
        // onclose will fire after this
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type) {
            this.emit(data.type, data.data || data)
          }
          this.emit('_message', data)
        } catch {
          // ignore non-JSON messages
        }
      }
    } catch {
      this._scheduleReconnect()
    }
  }

  private _scheduleReconnect() {
    if (!this.shouldReconnect) return
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    this.reconnectAttempts++

    this.reconnectTimer = setTimeout(() => {
      this._connect()
    }, delay)
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
  }

  send(data: Record<string, any>) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(data))
    }
  }

  on(event: string, handler: MessageHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
    return () => this.off(event, handler)
  }

  off(event: string, handler: MessageHandler) {
    this.handlers.get(event)?.delete(handler)
  }

  private emit(event: string, data: any) {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(data)
      } catch {
        // handler error
      }
    })
  }

  get connected(): boolean {
    return this.isConnected
  }
}

export const wsManager = new WebSocketManager()
export default wsManager
