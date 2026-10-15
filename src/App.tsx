/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Instrument, ProviderStatus } from './types/market';
import { HeaderBar } from './components/HeaderBar';
import { Navbar, ActiveTab } from './components/Navbar';
import { MarketOverview } from './components/modules/MarketOverview';
import { OptionChainView } from './components/modules/OptionChainView';
import { OISentimentView } from './components/modules/OISentimentView';
import { TechnicalAnalysisView } from './components/modules/TechnicalAnalysisView';
import { FundamentalAnalysisView } from './components/modules/FundamentalAnalysisView';
import { TradingSetupsView } from './components/modules/TradingSetupsView';
import { OptionsStrategyView } from './components/modules/OptionsStrategyView';
import { MarketScreenerView } from './components/modules/MarketScreenerView';
import { AiResearchAssistant } from './components/modules/AiResearchAssistant';
import { WatchlistsAlertsJournal } from './components/modules/WatchlistsAlertsJournal';
import { BacktestingView } from './components/modules/BacktestingView';
import { AdminDashboard } from './components/modules/AdminDashboard';
import { ExportModal } from './components/modals/ExportModal';
import { wsClient, ConnectionStatus, PriceTick } from './services/websocketStream';
import { FALLBACK_INSTRUMENTS, getFallbackProviderStatus } from './services/clientFallbackData';
import { Activity, ShieldAlert } from 'lucide-react';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { isLight } = useTheme();
  const [instruments, setInstruments] = useState<Instrument[]>(FALLBACK_INSTRUMENTS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NIFTY');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(() => getFallbackProviderStatus().status);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'trader'>('admin');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>('CONNECTING');
  const [wsLatency, setWsLatency] = useState<number>(8);

  const fetchInitialData = async () => {
    try {
      const [instRes, statusRes] = await Promise.all([
        fetch('/api/market/instruments'),
        fetch('/api/market/status'),
      ]);

      if (instRes.ok) {
        const instList = await instRes.json();
        if (Array.isArray(instList) && instList.length > 0) {
          setInstruments(instList);
        }
      }
      if (statusRes.ok) {
        const st = await statusRes.json();
        setProviderStatus({
          ...st.status,
          tradingHours: st.tradingHours,
          nextSyncInSeconds: st.nextSyncInSeconds,
        });
      }
    } catch (err) {
      console.warn('Backend snapshot unavailable, continuing with fallback engine:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Initial snapshot fetch
    fetchInitialData();

    // 2. Connect to Low-Latency WebSocket Streaming Service (Replacing continuous polling)
    wsClient.connect();

    // 3. Listen to incoming sub-second real-time price ticks
    const unbindTick = wsClient.onPriceTick((tick: PriceTick) => {
      setInstruments(prev => {
        let matched = false;
        const updated = prev.map(inst => {
          if (inst.symbol === tick.symbol) {
            matched = true;
            return {
              ...inst,
              currentPrice: tick.price,
              change: tick.change,
              changePercent: tick.changePercent,
              dayHigh: tick.dayHigh !== undefined ? Math.max(inst.dayHigh, tick.dayHigh) : Math.max(inst.dayHigh, tick.price),
              dayLow: tick.dayLow !== undefined ? Math.min(inst.dayLow, tick.dayLow) : Math.min(inst.dayLow, tick.price),
              volume: tick.volume || inst.volume,
              lastUpdated: tick.timestamp,
            };
          }
          return inst;
        });
        return matched ? updated : prev;
      });
    });

    // 4. Track WebSocket connection status & latency
    const unbindStatus = wsClient.onStatusChange((status, latency) => {
      setWsStatus(status);
      setWsLatency(latency);
    });

    // 5. Initial snapshot from WebSocket if available
    const unbindSnapshot = wsClient.onSnapshot((snapshot) => {
      if (Array.isArray(snapshot) && snapshot.length > 0) {
        setInstruments(prev => {
          const map = new Map(snapshot.map(s => [s.symbol, s]));
          return prev.map(inst => {
            const fresh = map.get(inst.symbol);
            if (fresh) {
              return { ...inst, ...fresh };
            }
            return inst;
          });
        });
      }
    });

    // 6. Slow background status refresh (every 30s) only to update server trading hours countdown
    const statusTimer = setInterval(async () => {
      try {
        const res = await fetch('/api/market/status');
        if (res.ok) {
          const st = await res.json();
          setProviderStatus({
            ...st.status,
            tradingHours: st.tradingHours,
            nextSyncInSeconds: st.nextSyncInSeconds,
          });
        }
      } catch (err) {
        // Handled silently
      }
    }, 30000);

    return () => {
      unbindTick();
      unbindStatus();
      unbindSnapshot();
      clearInterval(statusTimer);
      wsClient.disconnect();
    };
  }, []);

  // When selected symbol changes, ensure subscription
  useEffect(() => {
    if (selectedSymbol) {
      wsClient.subscribe([selectedSymbol]);
    }
  }, [selectedSymbol]);

  const activeInstrument = instruments.find(i => i.symbol === selectedSymbol) || instruments[0];

  return (
    <div className={`min-h-screen ${isLight ? 'theme-light bg-slate-50 text-slate-900' : 'bg-[#0b0f17] text-slate-100'} flex flex-col font-serif selection:bg-cyan-500 selection:text-white transition-colors duration-150`}>
      {/* Top Header & Live Ticker Bar with WebSocket Telemetry */}
      <HeaderBar
        instruments={instruments}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={sym => setSelectedSymbol(sym)}
        providerStatus={providerStatus}
        onOpenExport={() => setIsExportOpen(true)}
        currentUserRole={currentUserRole}
        onToggleRole={() => setCurrentUserRole(currentUserRole === 'admin' ? 'trader' : 'admin')}
        onManualSyncTriggered={fetchInitialData}
        wsStatus={wsStatus}
        wsLatency={wsLatency}
      />

      {/* Navigation Tab Bar */}
      <Navbar
        activeTab={activeTab}
        onChangeTab={tab => setActiveTab(tab)}
        isAdmin={currentUserRole === 'admin'}
      />

      {/* Selected Instrument Quick Status Ribbon */}
      {activeInstrument && activeTab !== 'overview' && (
        <section aria-label="Selected security summary" className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-3">
            <div>
              <span className="font-bold text-white text-sm">{activeInstrument.symbol}</span>
              <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">{activeInstrument.name}</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono-num">
              {activeInstrument.segment}
            </span>
            <span className="text-[10px] text-slate-400 font-mono-num hidden md:inline">
              Lot Size: {activeInstrument.lotSize}
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono-num">
            <div>
              <span className="text-slate-400 mr-1.5">LTP:</span>
              <span className="font-bold text-white text-sm">
                ₹{activeInstrument.currentPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <div className={`font-semibold ${activeInstrument.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {activeInstrument.change >= 0 ? '+' : ''}{activeInstrument.change} ({activeInstrument.changePercent}%)
            </div>
            <div className="text-slate-400 hidden lg:block">
              Range: ₹{activeInstrument.dayLow} – ₹{activeInstrument.dayHigh}
            </div>
            <div className="text-slate-400 hidden lg:block">
              Vol: {(activeInstrument.volume / 100000).toFixed(1)}L
            </div>
          </div>
        </section>
      )}

      {/* Main Terminal Viewport */}
      <main className="flex-1 overflow-y-auto">
        {loading && instruments.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Activity className="w-6 h-6 animate-spin text-cyan-400" />
            <div className="font-semibold text-slate-200">Initializing ProfitPulse Terminal Engine...</div>
            <div className="text-xs text-slate-500">Connecting to NSE derivatives feed & calculating Greeks</div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <MarketOverview
                onSelectSymbol={sym => setSelectedSymbol(sym)}
                onNavigateToTab={tab => setActiveTab(tab)}
              />
            )}

            {activeTab === 'option-chain' && (
              <OptionChainView
                symbol={selectedSymbol}
                onSelectSymbol={sym => setSelectedSymbol(sym)}
              />
            )}

            {activeTab === 'oi-sentiment' && (
              <OISentimentView
                onSelectSymbol={sym => setSelectedSymbol(sym)}
                onNavigateToTab={tab => setActiveTab(tab)}
              />
            )}

            {activeTab === 'technicals' && (
              <TechnicalAnalysisView symbol={selectedSymbol} />
            )}

            {activeTab === 'fundamentals' && (
              <FundamentalAnalysisView symbol={selectedSymbol} />
            )}

            {activeTab === 'setups' && (
              <TradingSetupsView
                onSelectSymbol={sym => setSelectedSymbol(sym)}
                onNavigateToTab={tab => setActiveTab(tab)}
              />
            )}

            {activeTab === 'strategy-analyzer' && (
              <OptionsStrategyView symbol={selectedSymbol} />
            )}

            {activeTab === 'screener' && (
              <MarketScreenerView
                onSelectSymbol={sym => setSelectedSymbol(sym)}
                onNavigateToTab={tab => setActiveTab(tab)}
              />
            )}

            {activeTab === 'ai-assistant' && (
              <AiResearchAssistant symbol={selectedSymbol} />
            )}

            {activeTab === 'watchlist-journal' && (
              <WatchlistsAlertsJournal
                instruments={instruments}
                onSelectSymbol={sym => setSelectedSymbol(sym)}
                onNavigateToTab={tab => setActiveTab(tab)}
              />
            )}

            {activeTab === 'backtesting' && (
              <BacktestingView instruments={instruments} />
            )}

            {activeTab === 'admin' && currentUserRole === 'admin' && (
              <AdminDashboard
                providerStatus={providerStatus}
                onRefreshStatus={fetchInitialData}
              />
            )}
          </>
        )}
      </main>

      {/* Export Reports Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        selectedSymbol={selectedSymbol}
      />

      {/* Terminal Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-4 py-2.5 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            <strong>Regulatory & Research Disclaimer:</strong> ProfitPulse AI is developed strictly for educational research and decision support. Derivatives trading (F&O) involves substantial risk of capital loss. Not SEBI registered investment advice.
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono-num text-[10px]">
          <span>Server Time: {new Date().toLocaleTimeString('en-IN')} IST</span>
          <span>Feed: {providerStatus?.name || 'NSE Certified Adapter'}</span>
        </div>
      </footer>
    </div>
  );
}
