import React, { useState, useEffect } from 'react';
import { ScreenerResult } from '../../types/market';
import { getFallbackScreener } from '../../services/clientFallbackData';
import { Search, Filter, ArrowUpRight, ArrowDownRight, BookmarkPlus, Layers } from 'lucide-react';

interface MarketScreenerViewProps {
  onSelectSymbol: (symbol: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const MarketScreenerView: React.FC<MarketScreenerViewProps> = ({ onSelectSymbol, onNavigateToTab }) => {
  const [filterId, setFilterId] = useState<string>('breakout_bullish');
  const [results, setResults] = useState<ScreenerResult[]>(() => getFallbackScreener('breakout_bullish'));
  const [loading, setLoading] = useState(false);

  const filters = [
    { id: 'breakout_bullish', label: 'Upper Bollinger Breakout', desc: 'Price expanding above 20-period upper band with high RSI.' },
    { id: 'ema_crossover', label: 'EMA 9 / 20 Golden Cross', desc: 'Fast 9 EMA crossing above 20 EMA with positive candle close.' },
    { id: 'long_buildup', label: 'Aggressive Long Buildup', desc: 'Surging open interest with positive price momentum in F&O.' },
    { id: 'oversold_reversal', label: 'RSI Deep Oversold (< 35)', desc: 'Mean reversion candidates approaching major support levels.' },
    { id: 'high_pcr_support', label: 'High PCR Floor (> 1.25)', desc: 'Heavy Put writing providing strong institutional floor.' },
  ];

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/screener?filter=${filterId}`);
      if (res.ok) {
        const json = await res.json();
        setResults(json);
      }
    } catch (err) {
      console.warn('Backend screener unavailable, using fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [filterId]);

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Preset Filter Segment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {filters.map(f => {
          const isActive = filterId === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilterId(f.id)}
              className={`p-3 rounded-lg border text-left transition ${
                isActive
                  ? 'bg-cyan-950/60 border-cyan-500 shadow-sm'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className={`text-xs font-bold ${isActive ? 'text-cyan-400' : 'text-slate-200'}`}>
                {f.label}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{f.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Results Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Matched Securities ({results.length})</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono-num">
            Active Filter: {filters.find(f => f.id === filterId)?.label}
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500 flex items-center justify-center gap-2 text-xs">
            <Search className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Scanning NSE Equity & Derivatives Catalogue...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No instruments currently match the selected quantitative condition.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 font-semibold bg-slate-950/60">
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">LTP</th>
                  <th className="py-2.5 px-3">Change %</th>
                  <th className="py-2.5 px-3">Volume</th>
                  <th className="py-2.5 px-3">PCR</th>
                  <th className="py-2.5 px-3">RSI(14)</th>
                  <th className="py-2.5 px-3">Signal Criteria</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-num">
                {results.map(r => {
                  const isBull = r.changePercent >= 0;
                  return (
                    <tr key={r.symbol} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-bold text-white">
                        <button
                          onClick={() => {
                            onSelectSymbol(r.symbol);
                            onNavigateToTab('option-chain');
                          }}
                          className="hover:text-cyan-400 transition"
                        >
                          {r.symbol}
                        </button>
                        <div className="text-[10px] font-normal text-slate-500 truncate max-w-[140px] font-sans">
                          {r.name}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        ₹{r.ltp.toLocaleString('en-IN')}
                      </td>
                      <td className={`py-2.5 px-3 font-bold ${isBull ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isBull ? '+' : ''}{r.changePercent}%
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {(r.volume / 100000).toFixed(1)}L
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {r.pcr ? r.pcr : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {r.rsi ? r.rsi : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex flex-wrap gap-1">
                          {r.matchedCriteria.map((crit: string, idx: number) => (
                            <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/60">
                              {crit}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <button
                          onClick={() => {
                            onSelectSymbol(r.symbol);
                            onNavigateToTab('option-chain');
                          }}
                          className="px-2 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded text-[11px] font-medium transition"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
