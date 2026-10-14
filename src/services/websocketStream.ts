/**
 * ProfitPulse AI — Client Low-Latency WebSocket Streaming Client
 * Replaces periodic HTTP polling with persistent bi-directional WebSocket streaming.
 */

export interface PriceTick {
  type: 'PRICE_TICK';
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  atmStrike?: number;
  timestamp: string;
}

export type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'RECONNECTING' | 'DISCONNECTED';

type PriceTickCallback = (tick: PriceTick) => void;
type StatusCallback = (status: ConnectionStatus, latencyMs: number) => void;
type SnapshotCallback = (snapshot: any[]) => void;

class WebSocketStreamClient {
  private socket: WebSocket | null = null;
  private priceTickListeners: Set<PriceTickCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private snapshotListeners: Set<SnapshotCallback> = new Set();
  private subscribedSymbols: Set<string> = new Set([
    'NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'RELIANCE', 'HDFCBANK', 'TCS', 'INFY',
  ]);
  private status: ConnectionStatus = 'DISCONNECTED';
  private latencyMs: number = 0;
  private reconnectAttempts = 0;
  private pingInterval: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;

  public connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isIntentionallyClosed = false;
    this.setStatus('CONNECTING', 0);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/live-stream`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('CONNECTED', this.latencyMs || 8);
        this.startHeartbeat();

        // Subscribe to current symbols
        if (this.subscribedSymbols.size > 0) {
          this.send({
            action: 'subscribe',
            symbols: Array.from(this.subscribedSymbols),
          });
        }
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'CONNECTION_ESTABLISHED') {
            if (Array.isArray(data.snapshot)) {
              this.snapshotListeners.forEach(cb => cb(data.snapshot));
            }
          } else if (data.type === 'PRICE_TICK') {
            this.priceTickListeners.forEach(cb => cb(data));
          } else if (data.type === 'PONG') {
            if (data.clientTime) {
              const rtt = Date.now() - data.clientTime;
              this.latencyMs = Math.max(1, Math.round(rtt / 2));
              this.setStatus('CONNECTED', this.latencyMs);
            }
          }
        } catch (err) {
          console.error('Failed to parse WebSocket streaming frame:', err);
        }
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        if (!this.isIntentionallyClosed) {
          this.setStatus('RECONNECTING', 0);
          this.scheduleReconnect();
        } else {
          this.setStatus('DISCONNECTED', 0);
        }
      };

      this.socket.onerror = (err) => {
        console.warn('WebSocket stream encounter, will reconnect:', err);
      };
    } catch (err) {
      console.error('WebSocket initial connect error:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);
    this.reconnectAttempts++;
    setTimeout(() => {
      if (!this.isIntentionallyClosed) {
        this.connect();
      }
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({ action: 'ping', time: Date.now() });
      }
    }, 4000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private setStatus(status: ConnectionStatus, latency: number) {
    this.status = status;
    this.latencyMs = latency;
    this.statusListeners.forEach(cb => cb(status, latency));
  }

  public subscribe(symbols: string[]) {
    symbols.forEach(s => this.subscribedSymbols.add(s.toUpperCase()));
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({ action: 'subscribe', symbols });
    }
  }

  public unsubscribe(symbols: string[]) {
    symbols.forEach(s => this.subscribedSymbols.delete(s.toUpperCase()));
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({ action: 'unsubscribe', symbols });
    }
  }

  public onPriceTick(callback: PriceTickCallback): () => void {
    this.priceTickListeners.add(callback);
    return () => this.priceTickListeners.delete(callback);
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.status, this.latencyMs);
    return () => this.statusListeners.delete(callback);
  }

  public onSnapshot(callback: SnapshotCallback): () => void {
    this.snapshotListeners.add(callback);
    return () => this.snapshotListeners.delete(callback);
  }

  private send(payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  public disconnect() {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus('DISCONNECTED', 0);
  }
}

export const wsClient = new WebSocketStreamClient();
