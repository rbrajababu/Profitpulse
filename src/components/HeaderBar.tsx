import React, { useState, useEffect } from 'react';
import { Instrument, ProviderStatus } from '../types/market';
import { ConnectionStatus } from '../services/websocketStream';
import { Search, Download, RefreshCw, Radio, UserCheck, Clock, CheckCircle2, Zap } from 'lucide-react';

interface HeaderBarProps {
  instruments: Instrument[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  providerStatus: ProviderStatus | null;
  onOpenExport: () => void;
  currentUserRole: 'admin' | 'trader';
  onToggleRole: () => void;
  onManualSyncTriggered?: () => void;
  wsStatus?: ConnectionStatus;
  wsLatency?: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  instruments,
  selectedSymbol,
  onSelectSymbol,
  providerStatus,
  onOpenExport,
  currentUserRole,
  onToggleRole,
  onManualSyncTriggered,
  wsStatus = 'CONNECTED',
  wsLatency = 8,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(60);

  useEffect(() => {
    if (providerStatus?.nextSyncInSeconds !== undefined) {
      setCountdown(providerStatus.nextSyncInSeconds);
    }
  }, [providerStatus?.nextSyncInSeconds]);

  // Local second countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 1 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/market/sync-nse-now', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setCountdown(60);
        setSyncFeedback('NSE Sync Completed');
        setTimeout(() => setSyncFeedback(null), 3000);
        if (onManualSyncTriggered) onManualSyncTriggered();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredInstruments = instruments.filter(
    i =>
      i.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const keyIndices = instruments.filter(i => i.segment === 'INDEX' || i.symbol === 'RELIANCE');
  const tradingHours = providerStatus?.tradingHours;
  const isMarketOpen = tradingHours ? tradingHours.isOpen : false;

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40 text-xs">
      {/* Real-time Ticker Tape with Minutely Update Telemetry */}
      <div className="flex items-center gap-6 px-4 py-1.5 border-b border-slate-800/80 bg-slate-900/40 overflow-x-auto whitespace-nowrap text-[11px]">
        <div className="flex items-center gap-2 text-slate-300 shrink-0 font-medium">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isMarketOpen ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isMarketOpen ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="font-semibold text-white">NSE INDIA LIVE FEED</span>
          <span className="text-slate-600">·</span>
          <span className={isMarketOpen ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {tradingHours ? tradingHours.session : 'NSE SESSION (09:15 - 15:30 IST)'}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Time: {tradingHours?.istTime || new Date().toLocaleTimeString('en-IN')}</span>
        </div>

        {/* Next 60-Second Refresh Countdown */}
        <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] text-cyan-300 font-mono-num">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>Next NSE Refresh: <strong className="text-white">{countdown}s</strong></span>
        </div>

        {/* Ticker tape items */}
        <div className="flex items-center gap-5 shrink-0">
          {keyIndices.map(inst => {
            const isBull = inst.change >= 0;
            return (
              <button
                key={inst.symbol}
                onClick={() => onSelectSymbol(inst.symbol)}
                className={`flex items-center gap-2 hover:bg-slate-800/60 px-2 py-0.5 rounded transition ${
                  selectedSymbol === inst.symbol ? 'bg-slate-800 text-white font-medium' : 'text-slate-300'
                }`}
              >
                <span className="font-semibold text-slate-200">{inst.symbol}</span>
                <span className="font-mono-num font-medium">₹{inst.currentPrice.toLocaleString('en-IN')}</span>
                <span className={`font-mono-num text-[10px] font-semibold ${isBull ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isBull ? '+' : ''}{inst.changePercent}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Terminal Action Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 gap-4">
        {/* Brand & Symbol Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center font-bold text-white shadow-sm">
              PP
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
                ProfitPulse AI
                <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/70 border border-cyan-800/80 px-1.5 py-0.2 rounded">
                  NSE TERMINAL
                </span>
              </div>
            </div>
          </div>

          {/* Quick Symbol Dropdown Search */}
          <div className="relative">
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1.5 w-64 text-slate-200 focus-within:border-cyan-500 transition">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search Symbol (e.g. NIFTY, RELIANCE)..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="bg-transparent border-none outline-none text-xs w-full text-slate-100 placeholder-slate-500"
              />
            </div>

            {isSearchOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsSearchOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-80 max-h-72 overflow-y-auto bg-slate-900 border border-slate-700 rounded-md shadow-2xl z-30 divide-y divide-slate-800/80">
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-950/60">
                    NSE Securities ({filteredInstruments.length})
                  </div>
                  {filteredInstruments.map(inst => (
                    <button
                      key={inst.symbol}
                      onClick={() => {
                        onSelectSymbol(inst.symbol);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800/80 flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                          {inst.symbol}
                          <span className="text-[10px] text-slate-400">({inst.segment})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{inst.name}</div>
                      </div>
                      <div className="text-right font-mono-num">
                        <div className="text-slate-200">₹{inst.currentPrice.toLocaleString('en-IN')}</div>
                        <div className={`text-[10px] font-medium ${inst.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {inst.change >= 0 ? '+' : ''}{inst.changePercent}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right side controls: NSE Sync button, Mode, Role switch, Export */}
        <div className="flex items-center gap-3">
          {/* Manual NSE Sync Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-cyan-800/60 text-cyan-300 hover:text-white rounded transition shadow-sm font-semibold"
            title="Force immediate live data update from NSE India website"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync NSE Now'}</span>
          </button>

          {syncFeedback && (
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {syncFeedback}
            </span>
          )}

          {/* WebSocket Low-Latency Streaming Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-cyan-950/60 border border-cyan-800/80 rounded text-slate-200">
            <Zap className={`w-3.5 h-3.5 ${wsStatus === 'CONNECTED' ? 'text-cyan-400 fill-cyan-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-slate-400 hidden sm:inline">Stream:</span>
            <span className="font-semibold text-cyan-300 font-mono-num text-[11px]">
              {wsStatus === 'CONNECTED' ? `FastAPI WS (${wsLatency}ms)` : wsStatus}
            </span>
          </div>

          {/* User Role Switcher */}
          <button
            onClick={onToggleRole}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-200 transition"
            title="Click to toggle between Admin and Trader access"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium capitalize">{currentUserRole}</span>
          </button>

          {/* Export Report Modal Trigger */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Reports</span>
          </button>
        </div>
      </div>
    </header>
  );
};
