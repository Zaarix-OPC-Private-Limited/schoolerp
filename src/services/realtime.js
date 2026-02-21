const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback
  if (typeof value === 'boolean') return value
  const normalized = String(value).trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

class RealtimeClient {
  constructor() {
    this.socket = null
    this.listeners = new Map()
    this.retryTimer = null
    this.retryCount = 0
    this.isManuallyClosed = false
  }

  isEnabled() {
    return parseBoolean(import.meta.env.VITE_REALTIME_ENABLED, true)
  }

  getUrl() {
    return import.meta.env.VITE_REALTIME_WS_URL || ''
  }

  connect() {
    if (!this.isEnabled()) return
    const url = this.getUrl()
    if (!url) return
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return

    try {
      this.socket = new WebSocket(url)
    } catch (_error) {
      this.scheduleReconnect()
      return
    }

    this.socket.onopen = () => {
      this.retryCount = 0
    }

    this.socket.onmessage = (event) => {
      this.handleMessage(event.data)
    }

    this.socket.onerror = () => {
      this.socket?.close()
    }

    this.socket.onclose = () => {
      this.socket = null
      if (this.isManuallyClosed) return
      this.scheduleReconnect()
    }
  }

  scheduleReconnect() {
    if (this.retryTimer || this.isManuallyClosed || !this.isEnabled()) return
    const delay = Math.min(10000, 1000 * 2 ** this.retryCount)
    this.retryCount += 1
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = null
      this.connect()
    }, delay)
  }

  handleMessage(rawData) {
    if (!rawData) return
    let parsed
    try {
      parsed = JSON.parse(rawData)
    } catch (_error) {
      return
    }
    const eventName = parsed.event || parsed.type
    const payload = parsed.payload ?? parsed.data ?? parsed
    if (!eventName) return
    this.emit(eventName, payload)
  }

  emit(eventName, payload) {
    const callbacks = this.listeners.get(eventName)
    if (!callbacks || !callbacks.size) return
    callbacks.forEach((callback) => {
      try {
        callback(payload)
      } catch (_error) {
        // no-op
      }
    })
  }

  subscribe(eventName, callback) {
    if (!eventName || typeof callback !== 'function') return () => {}
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set())
    }
    this.listeners.get(eventName).add(callback)
    this.connect()

    return () => {
      const callbacks = this.listeners.get(eventName)
      if (!callbacks) return
      callbacks.delete(callback)
      if (!callbacks.size) this.listeners.delete(eventName)
    }
  }

  close() {
    this.isManuallyClosed = true
    if (this.retryTimer) {
      window.clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
    if (this.socket) this.socket.close()
    this.socket = null
  }
}

export const realtime = new RealtimeClient()

export const subscribeRealtimeEvent = (eventName, callback) => realtime.subscribe(eventName, callback)
