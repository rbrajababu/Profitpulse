/**
 * ProfitPulse AI — High-Throughput Low-Latency WebSocket Streaming Service
 * Provides persistent bi-directional streaming for real-time market quotes and option updates,
 * eliminating client-side polling with sub-second tick streaming.
 */

import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { db } from './db';
import { Instrument } from '../src/types/market';

export interface PriceTickPayload {
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

export interface StreamStats {
  status: 'ONLINE' | 'OFFLINE';
  activeClients: number;
  totalMessagesStreamed: number;
  streamingIntervalMs: number;
  protocol: string;
  uptimeSeconds: number;
}

export class WebSocketStreamService {
  private wss: WebSocketServer | null = null;
  private subscriptions: Map<WebSocket, Set<string>> = new Map();
  private totalMessagesStreamed: number = 0;
  private startTime: number = Date.now();
  private streamingTimer: NodeJS.Timeout | null = null;
  private readonly STREAM_INTERVAL_MS = 350; // 350ms sub-second streaming

  public initialize(server: HttpServer) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws/live-stream',
    });

    this.wss.on('connection', (ws: WebSocket) => {
      // Default subscription to key indices and high-activity bluechips
      const defaultSubs = new Set(['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'RELIANCE', 'HDFCBANK', 'TCS', 'INFY']);
      this.subscriptions.set(ws, defaultSubs);

      // Send immediate handshake and initial snapshot
      const snapshot: Partial<Instrument>[] = Array.from(db.instruments.values()).map(inst => ({
        symbol: inst.symbol,
        currentPrice: inst.currentPrice,
        change: inst.change,
        changePercent: inst.changePercent,
        dayHigh: inst.dayHigh,
        dayLow: inst.dayLow,
        volume: inst.volume,
        lastUpdated: inst.lastUpdated,
      }));

      ws.send(JSON.stringify({
        type: 'CONNECTION_ESTABLISHED',
        provider: 'ProfitPulse Low-Latency WebSocket Stream Engine',
        protocolVersion: '2.4-stream',
        serverTime: new Date().toISOString(),
        subscribedSymbols: Array.from(defaultSubs),
        streamingIntervalMs: this.STREAM_INTERVAL_MS,
        snapshot,
      }));

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          const action = data.action;

          if (action === 'subscribe' && Array.isArray(data.symbols)) {
            const currentSubs = this.subscriptions.get(ws) || new Set();
            for (const sym of data.symbols) {
              currentSubs.add(String(sym).toUpperCase());
            }
            this.subscriptions.set(ws, currentSubs);
            ws.send(JSON.stringify({
              type: 'SUBSCRIPTION_CONFIRMED',
              subscribedSymbols: Array.from(currentSubs),
            }));
          } else if (action === 'unsubscribe' && Array.isArray(data.symbols)) {
            const currentSubs = this.subscriptions.get(ws);
            if (currentSubs) {
              for (const sym of data.symbols) {
                currentSubs.delete(String(sym).toUpperCase());
              }
            }
          } else if (action === 'ping') {
            ws.send(JSON.stringify({
              type: 'PONG',
              clientTime: data.time,
              serverTime: new Date().toISOString(),
            }));
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      });

      ws.on('close', () => {
        this.subscriptions.delete(ws);
      });

      ws.on('error', () => {
        this.subscriptions.delete(ws);
      });
    });

    this.startStreamingLoop();
    console.log('[WebSocket Service] Low-Latency WebSocket Streaming provider initialized on /ws/live-stream (350ms tick cadence).');
  }

  private startStreamingLoop() {
    if (this.streamingTimer) clearInterval(this.streamingTimer);

    this.streamingTimer = setInterval(() => {
      if (!this.wss || this.wss.clients.size === 0) return;

      const symbols = Array.from(db.instruments.keys());
      if (symbols.length === 0) return;

      // Select 2-4 symbols to simulate continuous order book trade matching
      const count = Math.min(3, symbols.length);
      const shuffled = [...symbols].sort(() => 0.5 - Math.random()).slice(0, count);

      for (const sym of shuffled) {
        const inst = db.instruments.get(sym);
        if (!inst) continue;

        const chain = db.optionChains.get(sym);

        const tick: PriceTickPayload = {
          type: 'PRICE_TICK',
          symbol: inst.symbol,
          price: inst.currentPrice,
          change: inst.change,
          changePercent: inst.changePercent,
          dayHigh: inst.dayHigh,
          dayLow: inst.dayLow,
          volume: inst.volume,
          atmStrike: chain?.atmStrike,
          timestamp: new Date().toISOString(),
        };

        this.broadcastToSubscribers(inst.symbol, tick);
      }
    }, this.STREAM_INTERVAL_MS);
  }

  public broadcastToSubscribers(symbol: string, payload: any) {
    if (!this.wss) return;
    const jsonStr = JSON.stringify(payload);
    this.totalMessagesStreamed++;

    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        const subs = this.subscriptions.get(client);
        if (subs && (subs.has(symbol) || subs.has('ALL'))) {
          try {
            client.send(jsonStr);
          } catch (err) {
            // Client drop handled on close
          }
        }
      }
    }
  }

  public broadcast(payload: any) {
    if (!this.wss) return;
    const jsonStr = JSON.stringify(payload);
    this.totalMessagesStreamed++;

    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(jsonStr);
        } catch (err) {
          // Handled on close
        }
      }
    }
  }

  public getStats(): StreamStats {
    const activeClients = this.wss ? Array.from(this.wss.clients).filter(c => c.readyState === WebSocket.OPEN).length : 0;
    return {
      status: 'ONLINE',
      activeClients,
      totalMessagesStreamed: this.totalMessagesStreamed,
      streamingIntervalMs: this.STREAM_INTERVAL_MS,
      protocol: 'Bi-directional Low-Latency WebSocket Stream',
      uptimeSeconds: Math.round((Date.now() - this.startTime) / 1000),
    };
  }
}

export const wsStreamService = new WebSocketStreamService();
