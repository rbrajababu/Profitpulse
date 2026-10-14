import React, { useState, useEffect } from 'react';
import { OIBuildupItem, BuildupType } from '../../types/market';
import { getFallbackOIBuildup } from '../../services/clientFallbackData';
import { Activity, TrendingUp, TrendingDown, RefreshCcw, Filter, AlertTriangle } from 'lucide-react';

interface OISentimentViewProps {
  onSelectSymbol: (symbol: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const OISentimentView: React.FC<OISentimentViewProps> = ({ onSelectSymbol, onNavigateToTab }) => {
  const [buildups, setBuildups] = useState<OIBuildupItem[]>(() => getFallbackOIBuildup());
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const fetchBuildups = async () => {
    try {
      const res = await fetch('/api/market/oi-buildup');
      if (res.ok) {
        const json = await res.json();
        setBuildups(json);
      }
    } catch (err) {
      console.warn('Backend OI Buildup unavailable, using fallback data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildups();
    const interval = setInterval(fetchBuildups, 4000);
    return () => clearInterval(interval);
  }, []);

  const counts = {
    LONG_BUILDUP: buildups.filter(b => b.buildup === 'LONG_BUILDUP').length,
    SHORT_BUILDUP: buildups.filter(b => b.buildup === 'SHORT_BUILDUP').length,
    SHORT_COVERING: buildups.filter(b => b.buildup === 'SHORT_COVERING').length,
    LONG_UNWINDING: buildups.filter(b => b.buildup === 'LONG_UNWINDING').length,
  };

  const filtered = buildups.filter(b => {
    if (selectedFilter === 'ALL') return true;
    return b.buildup === selectedFilter;
  });

  const getBuildupBadge = (type: BuildupType) => {
    switch (type) {
      case 'LONG_BUILDUP':
        return <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Long Buildup (Bullish)</span>;
      case 'SHORT_BUILDUP':
        return <span className="text-rose-400 font-semibold text-xs flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Short Buildup (Bearish)</span>;
      case 'SHORT_COVERING':
        return <span className="text-cyan-400 font-semibold text-xs flex items-center gap-1"><RefreshCcw className="w-3.5 h-3.5" /> Short Covering (Rally)</span>;
      case 'LONG_UNWINDING':
        return <span className="text-amber-400 font-semibold text-xs flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Long Unwinding (Weakness)</span>;
      default:
        return <span className="text-slate-400 text-xs">Neutral</span>;
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedFilter(selectedFilter === 'LONG_BUILDUP' ? 'ALL' : 'LONG_BUILDUP')}
          className={`p-3.5 rounded-lg border text-left transition ${
            selectedFilter === 'LONG_BUILDUP' ? 'bg-emerald-950/40 border-emerald-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span>Long Buildup</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-white mt-1">{counts.LONG_BUILDUP}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Price ▲ + OI ▲ (Bullish)</div>
        </button>

        <button
          onClick={() => setSelectedFilter(selectedFilter === 'SHORT_BUILDUP' ? 'ALL' : 'SHORT_BUILDUP')}
          className={`p-3.5 rounded-lg border text-left transition ${
            selectedFilter === 'SHORT_BUILDUP' ? 'bg-rose-950/40 border-rose-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-400 font-semibold">
            <span>Short Buildup</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-white mt-1">{counts.SHORT_BUILDUP}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Price ▼ + OI ▲ (Bearish)</div>
        </button>

        <button
          onClick={() => setSelectedFilter(selectedFilter === 'SHORT_COVERING' ? 'ALL' : 'SHORT_COVERING')}
          className={`p-3.5 rounded-lg border text-left transition ${
            selectedFilter === 'SHORT_COVERING' ? 'bg-cyan-950/40 border-cyan-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold">
            <span>Short Covering</span>
            <RefreshCcw className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-white mt-1">{counts.SHORT_COVERING}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Price ▲ + OI ▼ (Short Squeeze)</div>
        </button>

        <button
          onClick={() => setSelectedFilter(selectedFilter === 'LONG_UNWINDING' ? 'ALL' : 'LONG_UNWINDING')}
          className={`p-3.5 rounded-lg border text-left transition ${
            selectedFilter === 'LONG_UNWINDING' ? 'bg-amber-950/40 border-amber-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
            <span>Long Unwinding</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-white mt-1">{counts.LONG_UNWINDING}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Price ▼ + OI ▼ (Profit Booking)</div>
        </button>
      </div>

      {/* Filter Segment & Explanation */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">Filter:</span>
          {['ALL', 'LONG_BUILDUP', 'SHORT_BUILDUP', 'SHORT_COVERING', 'LONG_UNWINDING'].map(f => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`px-2.5 py-1 rounded transition text-[11px] font-semibold ${
                selectedFilter === f ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="text-slate-400 text-[11px] hidden sm:block">
          Showing {filtered.length} F&O Securities
        </div>
      </div>

      {/* Buildup Classification Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(item => (
          <div
            key={item.symbol}
            onClick={() => {
              onSelectSymbol(item.symbol);
              onNavigateToTab('option-chain');
            }}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-3.5 rounded-lg cursor-pointer transition shadow-sm group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-100 group-hover:text-cyan-400 transition text-sm">
                {item.symbol}
              </span>
              {getBuildupBadge(item.buildup)}
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 my-2 font-mono-num text-xs">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">LTP</div>
                <div className="font-semibold text-slate-200">₹{item.currentPrice.toLocaleString('en-IN')}</div>
                <div className={`text-[10px] font-medium ${item.priceChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.priceChangePercent >= 0 ? '+' : ''}{item.priceChangePercent}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Total OI</div>
                <div className="font-semibold text-slate-200">{(item.totalOi / 1000).toFixed(0)}k</div>
                <div className={`text-[10px] font-medium ${item.oiChangePercent >= 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {item.oiChangePercent >= 0 ? '+' : ''}{item.oiChangePercent}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">PCR</div>
                <div className="font-semibold text-slate-200">{item.pcr}</div>
                <div className="text-[10px] text-slate-500">
                  {item.pcr > 1.1 ? 'Supportive' : item.pcr < 0.85 ? 'Resistance' : 'Neutral'}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 line-clamp-2">
              {item.interpretation}
            </p>
          </div>
        ))}
      </div>

      <div className="p-3 bg-slate-900/40 border border-slate-800 rounded text-xs text-slate-500 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        <span>
          <strong>Methodology Note:</strong> Open Interest classification compares price trajectory with aggregate contract accumulation. It evaluates institutional positioning tendencies rather than individual participant intent.
        </span>
      </div>
    </div>
  );
};
