import React, { useState, useEffect } from 'react';
import { TradingSetup, SetupTimeframe } from '../../types/market';
import { getFallbackTradingSetups } from '../../services/clientFallbackData';
import { Crosshair, ShieldAlert, CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight, Filter } from 'lucide-react';

interface TradingSetupsViewProps {
  onSelectSymbol: (symbol: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const TradingSetupsView: React.FC<TradingSetupsViewProps> = ({ onSelectSymbol, onNavigateToTab }) => {
  const [setups, setSetups] = useState<TradingSetup[]>(() => getFallbackTradingSetups());
  const [loading, setLoading] = useState(false);
  const [selectedTf, setSelectedTf] = useState<string>('ALL');

  const fetchSetups = async () => {
    try {
      const res = await fetch('/api/setups');
      if (res.ok) {
        const json = await res.json();
        setSetups(json);
      }
    } catch (err) {
      console.warn('Backend trading setups unavailable, using fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetups();
    const interval = setInterval(fetchSetups, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredSetups = setups.filter(s => {
    if (selectedTf === 'ALL') return true;
    if (selectedTf === 'NO_TRADE') return s.isNoTrade;
    return s.timeframe === selectedTf && !s.isNoTrade;
  });

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Horizon Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">Setup Horizon:</span>
          {[
            { id: 'ALL', label: 'All Setups' },
            { id: 'INTRADAY', label: 'Intraday (Day Session)' },
            { id: 'SWING', label: 'Swing (2–10 Days)' },
            { id: 'SHORT_TERM', label: 'Positional (2–20 Days)' },
            { id: 'NO_TRADE', label: 'No Trade Standby' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTf(tab.id)}
              className={`px-3 py-1 rounded transition text-xs font-semibold ${
                selectedTf === tab.id
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-slate-400 text-xs">
          Showing {filteredSetups.length} Validated Setups
        </div>
      </div>

      {/* Setups Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSetups.map(setup => {
          const isBull = setup.bias === 'BULLISH';
          const isBear = setup.bias === 'BEARISH';
          const isNoTrade = setup.isNoTrade;

          return (
            <div
              key={setup.id}
              className={`border rounded-lg p-4 transition shadow-md ${
                isNoTrade
                  ? 'bg-slate-900/60 border-slate-800'
                  : isBull
                  ? 'bg-slate-900 border-slate-800 hover:border-emerald-600/50'
                  : 'bg-slate-900 border-slate-800 hover:border-rose-600/50'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectSymbol(setup.symbol);
                      onNavigateToTab('technicals');
                    }}
                    className="font-bold text-base text-white hover:text-cyan-400 transition"
                  >
                    {setup.symbol}
                  </button>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {setup.timeframe}
                  </span>
                </div>

                <div>
                  {isNoTrade ? (
                    <span className="text-xs font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2.5 py-0.5 rounded flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> NO TRADE (Stand Aside)
                    </span>
                  ) : isBull ? (
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> BULLISH BIAS
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2.5 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> BEARISH BIAS
                    </span>
                  )}
                </div>
              </div>

              {/* Setup Title */}
              <div className="mt-2.5 font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                <Crosshair className="w-4 h-4 text-cyan-400" />
                {setup.setupName}
              </div>

              {isNoTrade ? (
                <div className="my-3 p-3 bg-slate-950/60 border border-slate-800 rounded text-xs space-y-1.5">
                  <div className="text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Inadequate Risk-to-Reward / Conflicting Flow
                  </div>
                  <p className="text-slate-400">{setup.noTradeReason}</p>
                </div>
              ) : (
                <>
                  {/* Execution Levels Ribbon */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 my-2.5 border-y border-slate-800 font-mono-num text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Entry Zone</div>
                      <div className="font-bold text-slate-200 mt-0.5">{setup.entryZone}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Stop Loss</div>
                      <div className="font-bold text-rose-400 mt-0.5">₹{setup.stopLoss}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Target 1 / 2</div>
                      <div className="font-bold text-emerald-400 mt-0.5">₹{setup.target1} / ₹{setup.target2}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">R : R Ratio</div>
                      <div className="font-bold text-cyan-400 mt-0.5">1 : {setup.riskRewardRatio}</div>
                    </div>
                  </div>

                  {/* Position Sizing Recommendation */}
                  <div className="flex items-center justify-between text-xs bg-slate-950/70 p-2 rounded border border-slate-800/80 mb-2 font-mono-num">
                    <span className="text-slate-400">Position Sizing:</span>
                    <span className="font-semibold text-slate-200">
                      {setup.suggestedPositionSizeLots} Lots ({setup.suggestedQuantity} Qty)
                    </span>
                  </div>
                </>
              )}

              {/* Supporting Factors */}
              <div className="space-y-1 text-xs text-slate-300">
                <div className="text-[10px] uppercase font-semibold text-slate-500">Supporting Quantitative Evidence:</div>
                {setup.supportingFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                    <span className="text-cyan-400 mt-0.5">›</span>
                    <span>{factor}</span>
                  </div>
                ))}
              </div>

              {/* Invalidation Rules */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <strong className="text-amber-400">Invalidation Rule:</strong> {setup.invalidationCondition}
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono-num">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Valid Until: {new Date(setup.validUntil).toLocaleTimeString('en-IN')}
                </span>
                <span>Confidence: {setup.confidenceScore}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded text-xs text-slate-400 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <strong>Risk Management Discipline:</strong> All trading setups include predefined stop-loss invalidation thresholds and calculated risk-reward ratios. Never risk more than 1-2% of total trading equity on any single setup.
        </span>
      </div>
    </div>
  );
};
