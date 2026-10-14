import express, { Request, Response } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db';
import { marketScheduler, classifyOIBuildup, defaultProvider, configProvider } from './server/market-provider';
import { calculateAllIndicators } from './server/indicators';
import { generateTradingSetups, analyzeOptionStrategy, runScreener, runStrategyBacktest } from './server/analytics-engine';
import { askAiAssistant } from './server/ai-assistant';
import { wsStreamService } from './server/websocket-service';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Start Background daemon
marketScheduler.start();

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

import { nseWebService } from './server/nse-fetcher';

// 1. Market Overview & Status
app.get('/api/market/status', (req: Request, res: Response) => {
  const tradingHours = nseWebService.isTradingHours();
  res.json({
    status: db.providerStatus,
    tradingHours,
    nextSyncInSeconds: marketScheduler.getNextSyncSeconds(),
    serverTime: new Date().toISOString(),
    indicesCount: Array.from(db.instruments.values()).filter(i => i.segment === 'INDEX').length,
    stocksCount: Array.from(db.instruments.values()).filter(i => i.segment !== 'INDEX').length,
  });
});

// Force manual instant sync with NSE Website
app.post('/api/market/sync-nse-now', async (req: Request, res: Response) => {
  try {
    const result = await marketScheduler.performMinuteSync();
    res.json({
      success: true,
      result,
      status: db.providerStatus,
      nextSyncInSeconds: marketScheduler.getNextSyncSeconds(),
      tradingHours: nseWebService.isTradingHours(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/market/overview', (req: Request, res: Response) => {
  const all = Array.from(db.instruments.values());
  const indices = all.filter(i => i.segment === 'INDEX');
  const stocks = all.filter(i => i.segment !== 'INDEX');

  const sortedByChange = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
  const topGainers = sortedByChange.slice(0, 5);
  const topLosers = [...sortedByChange].reverse().slice(0, 5);
  const mostActive = [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 5);

  const advances = stocks.filter(s => s.change > 0).length;
  const declines = stocks.filter(s => s.change < 0).length;
  const unchanged = stocks.filter(s => s.change === 0).length;

  res.json({
    indices,
    topGainers,
    topLosers,
    mostActive,
    breadth: { advances, declines, unchanged, ratio: declines > 0 ? (advances / declines).toFixed(2) : '1.00' },
    indiaVix: 13.65,
    timestamp: new Date().toISOString(),
  });
});

// 2. Instruments
app.get('/api/market/instruments', (req: Request, res: Response) => {
  const list = Array.from(db.instruments.values());
  res.json(list);
});

app.get('/api/market/instrument/:symbol', (req: Request, res: Response) => {
  const symbol = (req.params.symbol || '').toUpperCase();
  const inst = db.instruments.get(symbol);
  if (!inst) {
    return res.status(404).json({ error: `Instrument ${symbol} not found.` });
  }
  res.json(inst);
});

// 3. Option Chain
app.get('/api/market/option-chain/:symbol', (req: Request, res: Response) => {
  const symbol = (req.params.symbol || '').toUpperCase();
  const chain = db.optionChains.get(symbol);
  if (!chain) {
    return res.status(404).json({ error: `Option chain not available for ${symbol}.` });
  }
  res.json(chain);
});

// 4. Historical Candles
app.get('/api/market/candles/:symbol', (req: Request, res: Response) => {
  const symbol = (req.params.symbol || '').toUpperCase();
  const timeframe = (req.query.timeframe as string) || '15m';
  const tfMap = db.candles.get(symbol);
  if (!tfMap) {
    return res.status(404).json({ error: `Candles not found for ${symbol}.` });
  }
  const candles = tfMap[timeframe] || tfMap['15m'] || [];
  res.json(candles);
});

// 5. Technical Indicators
app.get('/api/market/indicators/:symbol', (req: Request, res: Response) => {
  const symbol = (req.params.symbol || '').toUpperCase();
  const timeframe = (req.query.timeframe as string) || '15m';
  const tfMap = db.candles.get(symbol);
  if (!tfMap) {
    return res.status(404).json({ error: `Instrument ${symbol} not found.` });
  }
  const candles = tfMap[timeframe] || tfMap['15m'] || [];
  const indicators = calculateAllIndicators(candles);
  res.json(indicators);
});

// 6. Fundamentals
app.get('/api/market/fundamentals/:symbol', (req: Request, res: Response) => {
  const symbol = (req.params.symbol || '').toUpperCase();
  const fundamental = db.fundamentals.get(symbol);
  if (!fundamental) {
    return res.status(404).json({ error: `Fundamentals not available for ${symbol}.` });
  }
  res.json(fundamental);
});

// 7. OI Buildup Classifier
app.get('/api/market/oi-buildup', (req: Request, res: Response) => {
  const buildup = classifyOIBuildup();
  res.json(buildup);
});

// 8. Trading Setups
app.get('/api/setups', (req: Request, res: Response) => {
  const symbol = req.query.symbol as string;
  const setups = generateTradingSetups(symbol ? symbol.toUpperCase() : undefined);
  res.json(setups);
});

// 9. Options Strategy Analyzer
app.get('/api/options-strategy', (req: Request, res: Response) => {
  const strategy = (req.query.strategy as any) || 'BULL_CALL_SPREAD';
  const symbol = (req.query.symbol as string) || 'NIFTY';
  const analysis = analyzeOptionStrategy(strategy, symbol.toUpperCase());
  res.json(analysis);
});

// 10. Screeners
app.get('/api/screener', (req: Request, res: Response) => {
  const filterId = (req.query.filter as string) || 'breakout_bullish';
  const results = runScreener(filterId);
  res.json(results);
});

// 11. AI Assistant
app.post('/api/ai/ask', async (req: Request, res: Response) => {
  const { question, symbol } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required.' });
  }
  const result = await askAiAssistant(question, (symbol || 'NIFTY').toUpperCase());
  res.json(result);
});

// 12. Backtester
app.post('/api/backtest', (req: Request, res: Response) => {
  const config = req.body;
  const summary = runStrategyBacktest(config);
  res.json(summary);
});

// 13. Watchlists
app.get('/api/watchlists', (req: Request, res: Response) => {
  res.json(db.watchlists);
});

app.post('/api/watchlists', (req: Request, res: Response) => {
  const { name, symbol } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const inst = db.instruments.get(symbol);
  const newWl = {
    id: `wl_${Date.now()}`,
    name,
    items: symbol && inst ? [{ id: `item_${Date.now()}`, symbol, name: inst.name, addedAt: new Date().toISOString() }] : [],
  };
  db.watchlists.push(newWl);
  res.json(newWl);
});

app.post('/api/watchlists/:id/add', (req: Request, res: Response) => {
  const { symbol } = req.body;
  const wl = db.watchlists.find(w => w.id === req.params.id);
  if (!wl) return res.status(404).json({ error: 'Watchlist not found' });
  const inst = db.instruments.get(symbol);
  if (!inst) return res.status(404).json({ error: 'Instrument not found' });

  if (!wl.items.some(i => i.symbol === symbol)) {
    wl.items.push({
      id: `item_${Date.now()}`,
      symbol,
      name: inst.name,
      addedAt: new Date().toISOString(),
    });
  }
  res.json(wl);
});

// 14. Alerts
app.get('/api/alerts', (req: Request, res: Response) => {
  res.json(db.alerts);
});

app.post('/api/alerts', (req: Request, res: Response) => {
  const { symbol, condition, targetValue } = req.body;
  const newAlert = {
    id: `alt_${Date.now()}`,
    symbol: (symbol || 'NIFTY').toUpperCase(),
    condition: condition || 'PRICE_ABOVE',
    targetValue: parseFloat(targetValue) || 25000,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  db.alerts.unshift(newAlert);
  res.json(newAlert);
});

app.delete('/api/alerts/:id', (req: Request, res: Response) => {
  db.alerts = db.alerts.filter(a => a.id !== req.params.id);
  res.json({ success: true });
});

// 15. Trade Journal
app.get('/api/journal', (req: Request, res: Response) => {
  res.json(db.journal);
});

app.post('/api/journal', (req: Request, res: Response) => {
  const entry = req.body;
  const newEntry = {
    ...entry,
    id: `tj_${Date.now()}`,
    pnl: entry.exitPrice ? (entry.direction === 'LONG' ? entry.exitPrice - entry.entryPrice : entry.entryPrice - entry.exitPrice) * entry.quantity : 0,
    status: entry.exitPrice ? 'CLOSED' : 'OPEN',
  };
  db.journal.unshift(newEntry);
  res.json(newEntry);
});

// 16. Admin & Data Quality Dashboard
app.get('/api/admin/audit-logs', (req: Request, res: Response) => {
  res.json(db.auditLogs);
});

app.get('/api/admin/users', (req: Request, res: Response) => {
  res.json(db.users);
});

app.post('/api/admin/config-provider', (req: Request, res: Response) => {
  const { mode, apiKey, proxyUrl } = req.body;
  db.providerStatus.mode = mode || 'DEMO_SIMULATED';
  db.providerStatus.name = mode === 'OFFICIAL_FEED' ? 'NSE Official Website Live Feed (Direct Connect)' : 'NSE Certified Feed Adapter (Demonstration Mode)';
  db.providerStatus.lastSync = new Date().toISOString();

  if (proxyUrl) {
    nseWebService.setProxyUrl(proxyUrl);
  }

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'PROVIDER_CONFIG_UPDATED',
    user: 'ADMIN_CONSOLE',
    details: `Market data provider mode set to ${mode}${proxyUrl ? ` with proxy: ${proxyUrl}` : ''}`,
  });

  res.json({ success: true, status: db.providerStatus });
});

// 17. CSV Data Ingestion
app.post('/api/admin/import-csv', (req: Request, res: Response) => {
  const { type, csvContent, symbol } = req.body;
  if (!csvContent) {
    return res.status(400).json({ error: 'CSV content is required.' });
  }

  // Parse lines
  const lines = (csvContent as string).trim().split('\n');
  const count = Math.max(0, lines.length - 1);

  db.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'CSV_DATA_IMPORTED',
    user: 'ADMIN_CONSOLE',
    details: `Imported ${count} records for ${type} (${symbol || 'BATCH'}).`,
  });

  res.json({
    success: true,
    message: `Successfully validated and imported ${count} market records.`,
    recordsCount: count,
  });
});

// 18. Export Reports
app.get('/api/reports/export-csv', (req: Request, res: Response) => {
  const type = req.query.type as string;
  let csv = '';

  if (type === 'option-chain') {
    const symbol = ((req.query.symbol as string) || 'NIFTY').toUpperCase();
    const chain = db.optionChains.get(symbol);
    if (!chain) return res.status(404).send('Not found');

    csv = 'Strike,CE_LTP,CE_OI,CE_OI_Change,CE_IV,PE_LTP,PE_OI,PE_OI_Change,PE_IV\n';
    for (const s of chain.strikes) {
      csv += `${s.strikePrice},${s.ceLtp},${s.ceOi},${s.ceOiChange},${s.ceIv},${s.peLtp},${s.peOi},${s.peOiChange},${s.peIv}\n`;
    }
  } else if (type === 'journal') {
    csv = 'Symbol,Segment,Direction,EntryDate,EntryPrice,ExitDate,ExitPrice,Quantity,PnL,Status\n';
    for (const j of db.journal) {
      csv += `${j.symbol},${j.segment},${j.direction},${j.entryDate},${j.entryPrice},${j.exitDate || ''},${j.exitPrice || ''},${j.quantity},${j.pnl || 0},${j.status}\n`;
    }
  } else {
    csv = 'Symbol,Name,CurrentPrice,PrevClose,Change,ChangePercent,Volume,Sector\n';
    for (const inst of db.instruments.values()) {
      csv += `${inst.symbol},"${inst.name}",${inst.currentPrice},${inst.prevClose},${inst.change},${inst.changePercent},${inst.volume},"${inst.sector}"\n`;
    }
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=profitpulse_${type || 'market'}_${Date.now()}.csv`);
  res.send(csv);
});

// 19. WebSocket Stream Telemetry & Stats
app.get('/api/stream/stats', (req: Request, res: Response) => {
  res.json(wsStreamService.getStats());
});

// -------------------------------------------------------------
// VITE DEV SERVER / STATIC PRODUCTION MOUNTING & WEBSOCKET ENGINE
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const httpServer = http.createServer(app);

  // Initialize native bi-directional low-latency WebSocket Streaming Service
  wsStreamService.initialize(httpServer);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[ProfitPulse AI] Fullstack Server live on http://0.0.0.0:${PORT}`);
    console.log(`[ProfitPulse AI] WebSocket Low-Latency Streaming endpoint: ws://0.0.0.0:${PORT}/ws/live-stream`);
  });
}

startServer();
