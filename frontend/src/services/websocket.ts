/**
 * AuraCMS Realtime WebSocket Client
 * Connects frontend to the FastAPI backend WebSocket for live event-driven updates.
 */

export type RealtimeEventHandler = (event: string, data: any) => void;

class RealtimeSocket {
  private socket: WebSocket | null = null;
  private listeners: Set<RealtimeEventHandler> = new Set();
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private isExplicitlyClosed = false;

  public getWsUrl(): string {
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const apiUrl = import.meta.env.VITE_API_URL || (isProduction ? 'https://cms-l5qy.onrender.com/api/v1' : 'http://localhost:8000/api/v1');
    try {
      const parsed = new URL(apiUrl, window.location.href);
      const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${parsed.host}/ws`;
    } catch {
      return isProduction ? 'wss://cms-l5qy.onrender.com/ws' : 'ws://localhost:8000/ws';
    }
  }

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;

    try {
      const url = this.getWsUrl();
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        // Heartbeat ping every 25 seconds
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      this.socket.onmessage = (messageEvent) => {
        try {
          const payload = JSON.parse(messageEvent.data);
          const eventType = payload.event || 'message';
          const eventData = payload.data || {};
          this.listeners.forEach((listener) => {
            try {
              listener(eventType, eventData);
            } catch (err) {
              console.error('Error in websocket listener:', err);
            }
          });
        } catch {
          // Ignore non-json
        }
      };

      this.socket.onclose = () => {
        if (this.pingInterval) clearInterval(this.pingInterval);
        if (!this.isExplicitlyClosed) {
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            this.connect();
          }, 3000);
        }
      };

      this.socket.onerror = () => {
        // Will trigger onclose and attempt reconnect
      };
    } catch {
      if (!this.isExplicitlyClosed) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.connect();
        }, 4000);
      }
    }
  }

  public subscribe(handler: RealtimeEventHandler): () => void {
    this.listeners.add(handler);
    this.connect();
    return () => {
      this.listeners.delete(handler);
    };
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const realtimeSocket = new RealtimeSocket();
