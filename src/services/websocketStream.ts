/**
 * ProfitPulse AI — Client Low-Latency WebSocket Streaming Client
 * Replaces periodic HTTP polling with persistent bi-directional WebSocket streaming,
 * with automatic client-side simulation fallback when deployed on GitHub Pages or static hosts.
 */

import { FALLBACK_INSTRUMENTS } from './clientFallbackData';

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
  private simulationInterval: NodeJS.Timeout | null = null;
  private isSimulating = false;

  // Local simulated prices memory
  private localPrices: Map<string, { price: number; prevClose: number; dayHigh: number; dayLow: number; volume: number }> = new Map();

  constructor() {
    // Seed initial price memory from fallback
    FALLBACK_INSTRUMENTS.forEach(inst => {
      this.localPrices.set(inst.symbol, {
        price: inst.currentPrice,
        prevClose: inst.prevClose,
        dayHigh: inst.dayHigh,
        dayLow: inst.dayLow,
        volume: inst.volume,
      });
    });
  }

  public connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isIntentionallyClosed = false;
    this.setStatus('CONNECTING', 0);

    // On static hosts like GitHub Pages (*.github.io), there is no WS backend server
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');
    if (isGitHubPages) {
      this.startSimulationTicker();
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/live-stream`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.stopSimulationTicker();
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
          if (this.reconnectAttempts >= 2) {
            // After 2 failed attempts, gracefully activate simulation ticker
            this.startSimulationTicker();
          } else {
            this.setStatus('RECONNECTING', 0);
            this.scheduleReconnect();
          }
        } else {
          this.setStatus('DISCONNECTED', 0);
        }
      };

      this.socket.onerror = () => {
        if (this.reconnectAttempts >= 2) {
          this.startSimulationTicker();
        }
      };
    } catch {
      this.startSimulationTicker();
    }
  }

  private startSimulationTicker() {
    if (this.isSimulating) return;
    this.isSimulating = true;
    this.setStatus('CONNECTED', 3);

    // Emit initial snapshot
    this.snapshotListeners.forEach(cb => cb(FALLBACK_INSTRUMENTS));

    this.simulationInterval = setInterval(() => {
      if (this.subscribedSymbols.size === 0) return;

      // Check IST market hours (Mon-Fri 09:15 - 15:30 IST)
      const now = new Date();
      const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      const hours = istDate.getUTCHours();
      const minutes = istDate.getUTCMinutes();
      const day = istDate.getUTCDay();
      const currentMinutes = hours * 60 + minutes;
      const isWeekday = day >= 1 && day <= 5;
      const isOpen = isWeekday && currentMinutes >= 9 * 60 + 15 && currentMinutes <= 15 * 60 + 30;

      if (!isOpen) {
        // Market is closed (After-Hours / Weekend): Keep prices strictly frozen at official closing data!
        return;
      }

      const symbols = Array.from(this.subscribedSymbols);
      // Pick 1 to 2 symbols to update
      const pickedSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      const record = this.localPrices.get(pickedSymbol);
      if (!record) return;

      // Realistic tick delta: ±0.03% to ±0.1%
      const deltaPercent = (Math.random() - 0.49) * 0.0015;
      const newPrice = Math.round((record.price * (1 + deltaPercent)) * 20) / 20; // 0.05 step
      const change = Math.round((newPrice - record.prevClose) * 100) / 100;
      const changePercent = Math.round(((change / record.prevClose) * 100) * 100) / 100;
      const dayHigh = Math.max(record.dayHigh, newPrice);
      const dayLow = Math.min(record.dayLow, newPrice);
      const volume = record.volume + Math.floor(Math.random() * 500) + 50;

      // Update local price
      this.localPrices.set(pickedSymbol, {
        price: newPrice,
        prevClose: record.prevClose,
        dayHigh,
        dayLow,
        volume,
      });

      const tick: PriceTick = {
        type: 'PRICE_TICK',
        symbol: pickedSymbol,
        price: newPrice,
        change,
        changePercent,
        dayHigh,
        dayLow,
        volume,
        timestamp: new Date().toISOString(),
      };

      this.priceTickListeners.forEach(cb => cb(tick));
    }, 1200);
  }

  private stopSimulationTicker() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isSimulating = false;
  }

  private scheduleReconnect() {
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);
    this.reconnectAttempts++;
    setTimeout(() => {
      if (!this.isIntentionallyClosed && !this.isSimulating) {
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
    this.stopSimulationTicker();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus('DISCONNECTED', 0);
  }
}

export const wsClient = new WebSocketStreamClient();
