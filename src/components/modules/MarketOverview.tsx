import React, { useState, useEffect } from 'react';
import { Instrument } from '../../types/market';
import { getFallbackOverview } from '../../services/clientFallbackData';
import { TrendingUp, TrendingDown, Activity, AlertCircle, ArrowUpRight, ArrowDownRight, Layers, BarChart2 } from 'lucide-react';

interface MarketOverviewProps {
  onSelectSymbol: (symbol: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({ onSelectSymbol, onNavigateToTab }) => {
  const [overview, setOverview] = useState<any>(() => getFallbackOverview());
  const [loading, setLoading] = useState(false);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/market/overview');
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (err) {
      console.warn('Backend overview unavailable, using fallback data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !overview) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
        <Activity className="w-4 h-4 animate-spin text-cyan-400" />
        <span>Loading Real-time Market Overview...</span>
      </div>
    );
  }

  const { indices, topGainers, topLosers, mostActive, breadth, indiaVix } = overview || {};
  const advances = breadth?.advances ?? 32;
  const declines = breadth?.declines ?? 18;
  const unchanged = breadth?.unchanged ?? 0;
  const totalStocks = advances + declines + unchanged;
  const advancePercent = Math.round((advances / (totalStocks || 1)) * 100);
  const breadthRatio = breadth?.ratio ?? (declines > 0 ? (advances / declines).toFixed(2) : '1.78');

  // Handle indiaVix gracefully whether provided as an object { currentPrice, change, changePercent } or a plain number
  const vixPrice: number = typeof indiaVix === 'object' && indiaVix !== null
    ? (typeof indiaVix.currentPrice === 'number' ? indiaVix.currentPrice : 13.45)
    : (typeof indiaVix === 'number' ? indiaVix : 13.45);

  const vixChangePercent: number = typeof indiaVix === 'object' && indiaVix !== null
    ? (typeof indiaVix.changePercent === 'number' ? indiaVix.changePercent : -2.54)
    : -0.42;

  const vixChange: number = typeof indiaVix === 'object' && indiaVix !== null
    ? (typeof indiaVix.change === 'number' ? indiaVix.change : -0.35)
    : -0.06;

  return (
    <div className="p-4 space-y-5 max-w-7xl mx-auto">
      {/* Benchmark Indices Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {indices.map((idx: Instrument) => {
          const isBull = idx.change >= 0;
          return (
            <div
              key={idx.symbol}
              onClick={() => {
                onSelectSymbol(idx.symbol);
                onNavigateToTab('option-chain');
              }}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-3.5 rounded-lg cursor-pointer transition shadow-sm group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-200 group-hover:text-cyan-400 transition flex items-center gap-1.5">
                  {idx.symbol}
                  <span className="text-[10px] text-slate-500 font-normal">F&O Index</span>
                </span>
                <span className={`flex items-center text-xs font-semibold font-mono-num ${isBull ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isBull ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                  {isBull ? '+' : ''}{idx.changePercent}%
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-xl font-bold font-mono-num text-white">
                  ₹{idx.currentPrice.toLocaleString('en-IN')}
                </div>
                <div className={`text-xs font-mono-num font-medium ${isBull ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isBull ? '+' : ''}{idx.change} pts
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono-num">
                <span>L: ₹{idx.dayLow.toLocaleString('en-IN')}</span>
                <span>H: ₹{idx.dayHigh.toLocaleString('en-IN')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Market Breadth & India VIX Sentiment Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* NSE Market Breadth */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-lg md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                NSE Market Breadth (Advances vs Declines)
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono-num">
              Ratio: <span className="font-semibold text-slate-200">{breadthRatio}</span>
            </div>
          </div>

          {/* Breadth Bar */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${advancePercent}%` }} />
              <div className="bg-rose-500 transition-all duration-500" style={{ width: `${100 - advancePercent}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs font-mono-num">
              <span className="text-emerald-400 font-medium">Advances: {advances} ({advancePercent}%)</span>
              <span className="text-slate-400">Unchanged: {unchanged}</span>
              <span className="text-rose-400 font-medium">Declines: {declines} ({100 - advancePercent}%)</span>
            </div>
          </div>
        </div>

        {/* India VIX & Regime */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                India VIX Volatility
              </span>
            </div>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
              vixPrice < 15
                ? 'text-amber-400 bg-amber-950/40 border-amber-800/40'
                : vixPrice < 20
                ? 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40'
                : 'text-rose-400 bg-rose-950/40 border-rose-800/40'
            }`}>
              {vixPrice < 15 ? 'LOW VOLATILITY REGIME' : vixPrice < 20 ? 'NORMAL VOLATILITY' : 'HIGH VOLATILITY REGIME'}
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-1">
            <span className="text-2xl font-bold font-mono-num text-white">{vixPrice.toFixed(2)}</span>
            <span className={`text-xs font-mono-num font-medium ${vixChangePercent <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {vixChangePercent >= 0 ? '+' : ''}{vixChangePercent}% Today
            </span>
          </div>

          <div className="text-[11px] text-slate-400 mt-2">
            Low volatility regime indicates stable option premium decay (Theta). Suitable for defined-risk credit spreads and debit breakout setups.
          </div>
        </div>
      </div>

      {/* Top Gainers, Losers, and Most Active Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Top Gainers */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 uppercase tracking-wider pb-1.5 border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Top Gainers
            </span>
            <span className="text-slate-500 font-normal text-[11px]">NSE F&O</span>
          </div>
          <div className="space-y-1">
            {topGainers.map((inst: Instrument) => (
              <div
                key={inst.symbol}
                onClick={() => {
                  onSelectSymbol(inst.symbol);
                  onNavigateToTab('option-chain');
                }}
                className="flex items-center justify-between p-2 rounded hover:bg-slate-800/70 cursor-pointer transition text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">{inst.symbol}</div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{inst.sector}</div>
                </div>
                <div className="text-right font-mono-num">
                  <div className="text-slate-200 font-medium">₹{inst.currentPrice.toLocaleString('en-IN')}</div>
                  <div className="text-emerald-400 font-semibold text-[11px]">+{inst.changePercent}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-400 uppercase tracking-wider pb-1.5 border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" /> Top Losers
            </span>
            <span className="text-slate-500 font-normal text-[11px]">NSE F&O</span>
          </div>
          <div className="space-y-1">
            {topLosers.map((inst: Instrument) => (
              <div
                key={inst.symbol}
                onClick={() => {
                  onSelectSymbol(inst.symbol);
                  onNavigateToTab('option-chain');
                }}
                className="flex items-center justify-between p-2 rounded hover:bg-slate-800/70 cursor-pointer transition text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">{inst.symbol}</div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{inst.sector}</div>
                </div>
                <div className="text-right font-mono-num">
                  <div className="text-slate-200 font-medium">₹{inst.currentPrice.toLocaleString('en-IN')}</div>
                  <div className="text-rose-400 font-semibold text-[11px]">{inst.changePercent}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active by Volume */}
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 uppercase tracking-wider pb-1.5 border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Most Active by Volume
            </span>
            <span className="text-slate-500 font-normal text-[11px]">Liquidity Leaders</span>
          </div>
          <div className="space-y-1">
            {mostActive.map((inst: Instrument) => (
              <div
                key={inst.symbol}
                onClick={() => {
                  onSelectSymbol(inst.symbol);
                  onNavigateToTab('technicals');
                }}
                className="flex items-center justify-between p-2 rounded hover:bg-slate-800/70 cursor-pointer transition text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">{inst.symbol}</div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    Vol: {(inst.volume / 100000).toFixed(1)}L
                  </div>
                </div>
                <div className="text-right font-mono-num">
                  <div className="text-slate-200 font-medium">₹{inst.currentPrice.toLocaleString('en-IN')}</div>
                  <div className={`text-[11px] font-semibold ${inst.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {inst.change >= 0 ? '+' : ''}{inst.changePercent}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
