import React, { useState, useEffect } from 'react';
import { Watchlist, AlertRule, TradeJournalEntry, Instrument } from '../../types/market';
import { getFallbackWatchlists, getFallbackAlerts, getFallbackJournal } from '../../services/clientFallbackData';
import { Bookmark, Bell, BookOpen, Plus, Trash2, CheckCircle2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface WatchlistsAlertsJournalProps {
  instruments: Instrument[];
  onSelectSymbol: (symbol: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const WatchlistsAlertsJournal: React.FC<WatchlistsAlertsJournalProps> = ({
  instruments,
  onSelectSymbol,
  onNavigateToTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'watchlists' | 'alerts' | 'journal'>('watchlists');

  // Watchlists state
  const [watchlists, setWatchlists] = useState<Watchlist[]>(() => getFallbackWatchlists());
  const [selectedWlId, setSelectedWlId] = useState<string>('wl_default');
  const [newWlName, setNewWlName] = useState('');
  const [addSymbol, setAddSymbol] = useState('');

  // Alerts state
  const [alerts, setAlerts] = useState<AlertRule[]>(() => getFallbackAlerts());
  const [newAlertSymbol, setNewAlertSymbol] = useState('NIFTY');
  const [newAlertCondition, setNewAlertCondition] = useState<AlertRule['condition']>('PRICE_ABOVE');
  const [newAlertTarget, setNewAlertTarget] = useState('25000');

  // Trade Journal state
  const [journal, setJournal] = useState<TradeJournalEntry[]>(() => getFallbackJournal());
  const [showNewTradeModal, setShowNewTradeModal] = useState(false);
  const [newTrade, setNewTrade] = useState({
    symbol: 'NIFTY',
    segment: 'OPTIONS' as const,
    direction: 'LONG' as const,
    entryPrice: 150,
    exitPrice: 0,
    quantity: 75,
    stopLoss: 120,
    target: 200,
    notes: '',
    setupType: 'VWAP Breakout',
  });

  const fetchData = async () => {
    try {
      const [wlRes, altRes, tjRes] = await Promise.all([
        fetch('/api/watchlists'),
        fetch('/api/alerts'),
        fetch('/api/journal'),
      ]);

      if (wlRes.ok) {
        const wl = await wlRes.json();
        setWatchlists(wl);
        if (wl.length > 0 && !selectedWlId) setSelectedWlId(wl[0].id);
      }
      if (altRes.ok) setAlerts(await altRes.json());
      if (tjRes.ok) setJournal(await tjRes.json());
    } catch (err) {
      console.error('Failed to load portfolio items:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add symbol to watchlist
  const handleAddToWatchlist = async () => {
    if (!selectedWlId || !addSymbol) return;
    try {
      const res = await fetch(`/api/watchlists/${selectedWlId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: addSymbol.toUpperCase() }),
      });
      if (res.ok) {
        setAddSymbol('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create alert
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newAlertSymbol,
          condition: newAlertCondition,
          targetValue: newAlertTarget,
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Add trade to journal
  const handleAddTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTrade,
          entryDate: new Date().toISOString(),
          exitDate: newTrade.exitPrice > 0 ? new Date().toISOString() : undefined,
        }),
      });
      if (res.ok) {
        setShowNewTradeModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedWl = watchlists.find(w => w.id === selectedWlId) || watchlists[0];

  // Journal metrics
  const closedTrades = journal.filter(t => t.status === 'CLOSED');
  const winTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
  const winRate = closedTrades.length > 0 ? Math.round((winTrades.length / closedTrades.length) * 100) : 0;
  const totalRealizedPnl = closedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Subtab navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        {[
          { id: 'watchlists', label: 'Watchlists', icon: Bookmark },
          { id: 'alerts', label: 'Real-Time Alerts', icon: Bell },
          { id: 'journal', label: 'Trade Journal & P&L', icon: BookOpen },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition font-semibold ${
                isActive ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. WATCHLISTS TAB */}
      {activeSubTab === 'watchlists' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Active List:</span>
              <select
                value={selectedWlId}
                onChange={e => setSelectedWlId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 outline-none font-semibold"
              >
                {watchlists.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.items.length})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Symbol (e.g. RELIANCE)..."
                value={addSymbol}
                onChange={e => setAddSymbol(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 outline-none uppercase w-44"
              />
              <button
                onClick={handleAddToWatchlist}
                className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Watchlist Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] uppercase text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Company Name</th>
                  <th className="py-2.5 px-3">Price</th>
                  <th className="py-2.5 px-3">Day Change</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-num">
                {selectedWl?.items.map(item => {
                  const inst = instruments.find(i => i.symbol === item.symbol);
                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-bold text-white">
                        <button
                          onClick={() => {
                            onSelectSymbol(item.symbol);
                            onNavigateToTab('option-chain');
                          }}
                          className="hover:text-cyan-400 transition"
                        >
                          {item.symbol}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans">{item.name}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        ₹{inst ? inst.currentPrice.toLocaleString('en-IN') : '—'}
                      </td>
                      <td className={`py-2.5 px-3 font-bold ${inst && inst.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {inst ? `${inst.change >= 0 ? '+' : ''}${inst.changePercent}%` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <button
                          onClick={() => {
                            onSelectSymbol(item.symbol);
                            onNavigateToTab('technicals');
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition"
                        >
                          Chart
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. ALERTS TAB */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-4">
          {/* Create Alert Form */}
          <form
            onSubmit={handleCreateAlert}
            className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Symbol:</span>
              <select
                value={newAlertSymbol}
                onChange={e => setNewAlertSymbol(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 outline-none font-semibold"
              >
                {instruments.map(i => (
                  <option key={i.symbol} value={i.symbol}>
                    {i.symbol}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Condition:</span>
              <select
                value={newAlertCondition}
                onChange={e => setNewAlertCondition(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 outline-none"
              >
                <option value="PRICE_ABOVE">Price Crosses Above</option>
                <option value="PRICE_BELOW">Price Crosses Below</option>
                <option value="PCR_ABOVE">PCR Exceeds (Put writing surge)</option>
                <option value="PCR_BELOW">PCR Drops Below (Call writing surge)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Target Level:</span>
              <input
                type="number"
                step="any"
                value={newAlertTarget}
                onChange={e => setNewAlertTarget(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 outline-none w-28 font-mono-num"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded transition"
            >
              <Plus className="w-3.5 h-3.5" /> Create Alert
            </button>
          </form>

          {/* Active Alerts List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map(a => (
              <div
                key={a.id}
                className={`p-3.5 rounded-lg border text-xs space-y-1.5 transition ${
                  a.isActive ? 'bg-slate-900 border-slate-800' : 'bg-slate-900/50 border-slate-800/60 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{a.symbol}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        a.isActive
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {a.isActive ? 'MONITORING' : 'TRIGGERED'}
                    </span>
                    <button
                      onClick={() => handleDeleteAlert(a.id)}
                      className="text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-slate-300 font-mono-num">
                  Condition: {a.condition.replace('_', ' ')} {a.targetValue}
                </div>

                {a.message && (
                  <div className="text-[11px] text-emerald-400 font-sans mt-1 bg-emerald-950/20 p-1.5 rounded">
                    ✓ {a.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TRADE JOURNAL TAB */}
      {activeSubTab === 'journal' && (
        <div className="space-y-4">
          {/* Summary Metric Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-num text-xs">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase">Realized P&L</div>
              <div className={`text-lg font-bold mt-0.5 ${totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{totalRealizedPnl.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase">Win Rate</div>
              <div className="text-lg font-bold text-cyan-400 mt-0.5">{winRate}%</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase">Closed Trades</div>
              <div className="text-lg font-bold text-white mt-0.5">{closedTrades.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Open Positions</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">{journal.filter(t => t.status === 'OPEN').length}</div>
              </div>
              <button
                onClick={() => setShowNewTradeModal(true)}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold font-sans transition"
              >
                + Log Trade
              </button>
            </div>
          </div>

          {/* Journal Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] uppercase text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Segment</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">Entry</th>
                  <th className="py-2.5 px-3">Exit</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3">Realized P&L</th>
                  <th className="py-2.5 px-3">Setup</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-num">
                {journal.map(trade => (
                  <tr key={trade.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-bold text-white">{trade.symbol}</td>
                    <td className="py-2.5 px-3 text-slate-400">{trade.segment}</td>
                    <td className={`py-2.5 px-3 font-bold ${trade.direction === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.direction}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">₹{trade.entryPrice}</td>
                    <td className="py-2.5 px-3 text-slate-200">{trade.exitPrice ? `₹${trade.exitPrice}` : 'Open'}</td>
                    <td className="py-2.5 px-3 text-slate-300">{trade.quantity}</td>
                    <td className={`py-2.5 px-3 font-bold ${(trade.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.pnl ? `₹${trade.pnl.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans">{trade.setupType}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${trade.status === 'CLOSED' ? 'bg-slate-800 text-slate-300' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                        {trade.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* New Trade Modal */}
          {showNewTradeModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 max-w-md w-full space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="font-bold text-white text-sm">Log Executed or Simulated Trade</h3>
                  <button onClick={() => setShowNewTradeModal(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleAddTrade} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 text-[11px]">Symbol</label>
                      <input
                        type="text"
                        value={newTrade.symbol}
                        onChange={e => setNewTrade({ ...newTrade, symbol: e.target.value.toUpperCase() })}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white uppercase outline-none mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px]">Segment</label>
                      <select
                        value={newTrade.segment}
                        onChange={e => setNewTrade({ ...newTrade, segment: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white outline-none mt-1"
                      >
                        <option value="OPTIONS">OPTIONS</option>
                        <option value="FUTURES">FUTURES</option>
                        <option value="EQUITY">EQUITY</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-400 text-[11px]">Direction</label>
                      <select
                        value={newTrade.direction}
                        onChange={e => setNewTrade({ ...newTrade, direction: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white outline-none mt-1"
                      >
                        <option value="LONG">LONG</option>
                        <option value="SHORT">SHORT</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px]">Entry Price</label>
                      <input
                        type="number"
                        step="any"
                        value={newTrade.entryPrice}
                        onChange={e => setNewTrade({ ...newTrade, entryPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white outline-none mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px]">Quantity</label>
                      <input
                        type="number"
                        value={newTrade.quantity}
                        onChange={e => setNewTrade({ ...newTrade, quantity: parseInt(e.target.value) || 1 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white outline-none mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 text-[11px]">Exit Price (Optional if Open)</label>
                      <input
                        type="number"
                        step="any"
                        value={newTrade.exitPrice}
                        onChange={e => setNewTrade({ ...newTrade, exitPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white outline-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px]">Setup Name</label>
                      <input
                        type="text"
                        value={newTrade.setupType}
                        onChange={e => setNewTrade({ ...newTrade, setupType: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white outline-none mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewTradeModal(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold"
                    >
                      Save Journal Entry
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
