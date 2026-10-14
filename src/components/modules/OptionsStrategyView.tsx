import React, { useState, useEffect } from 'react';
import { StrategyAnalysis } from '../../types/market';
import { getFallbackOptionsStrategy } from '../../services/clientFallbackData';
import { Scale, ShieldAlert, ArrowRight, TrendingUp, AlertTriangle, Info } from 'lucide-react';

interface OptionsStrategyViewProps {
  symbol: string;
}

export const OptionsStrategyView: React.FC<OptionsStrategyViewProps> = ({ symbol }) => {
  const [strategy, setStrategy] = useState<string>('BULL_CALL_SPREAD');
  const [data, setData] = useState<StrategyAnalysis | null>(() => getFallbackOptionsStrategy('BULL_CALL_SPREAD', symbol));
  const [loading, setLoading] = useState(false);

  const fetchStrategy = async () => {
    try {
      const res = await fetch(`/api/options-strategy?strategy=${strategy}&symbol=${symbol}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn('Backend options strategy unavailable, using fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategy();
  }, [strategy, symbol]);

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
        <Scale className="w-4 h-4 animate-spin text-cyan-400" />
        <span>Computing Options Payoff & Greeks Matrix...</span>
      </div>
    );
  }

  // Payoff Chart Scaling
  const chartHeight = 240;
  const chartWidth = 750;
  const padding = { top: 20, right: 30, bottom: 30, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const pnls = data.payoffPoints.map(p => p.pnlAtExpiry);
  const maxPnl = Math.max(...pnls, 1000);
  const minPnl = Math.min(...pnls, -1000);
  const pnlSpan = maxPnl - minPnl || 1;

  const prices = data.payoffPoints.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceSpan = maxPrice - minPrice || 1;

  const getY = (pnl: number) => {
    return padding.top + innerHeight - ((pnl - minPnl) / pnlSpan) * innerHeight;
  };

  const getX = (price: number) => {
    return padding.left + ((price - minPrice) / priceSpan) * innerWidth;
  };

  const zeroY = getY(0);

  // Path generator for expiry payoff
  const expiryPath = data.payoffPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(pt.price)} ${getY(pt.pnlAtExpiry)}`)
    .join(' ');

  const currentPath = data.payoffPoints
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(pt.price)} ${getY(pt.pnlCurrent)}`)
    .join(' ');

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Strategy Selector Buttons */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs">
        {[
          { id: 'BULL_CALL_SPREAD', label: 'Bull Call Spread (Defined Risk)' },
          { id: 'BEAR_PUT_SPREAD', label: 'Bear Put Spread (Defined Risk)' },
          { id: 'IRON_CONDOR', label: 'Iron Condor (Rangebound Credit)' },
          { id: 'LONG_CALL', label: 'Long Call Option' },
          { id: 'LONG_PUT', label: 'Long Put Option' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setStrategy(s.id)}
            className={`px-3 py-1.5 rounded transition font-semibold ${
              strategy === s.id
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Main Analysis Card */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div>
            <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">Options Strategy Profile</div>
            <h2 className="text-lg font-bold text-white mt-0.5">{data.strategyName}</h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700">
              Outlook: {data.outlook}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-cyan-400 border border-slate-700">
              R:R: {data.riskReward}
            </span>
          </div>
        </div>

        {/* Financial Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-num text-xs">
          <div className="bg-slate-950 p-3 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-500 uppercase">Max Profit</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">{data.maxProfit}</div>
          </div>
          <div className="bg-slate-950 p-3 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-500 uppercase">Max Loss</div>
            <div className="text-base font-bold text-rose-400 mt-0.5">{data.maxLoss}</div>
          </div>
          <div className="bg-slate-950 p-3 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-500 uppercase">Breakeven(s)</div>
            <div className="text-base font-bold text-white mt-0.5">{data.breakevens.map(b => `₹${b}`).join(' | ')}</div>
          </div>
          <div className="bg-slate-950 p-3 rounded border border-slate-800/80">
            <div className="text-[10px] text-slate-500 uppercase">Est. Taxes & STT</div>
            <div className="text-base font-bold text-amber-400 mt-0.5">₹{data.estBrokerageTaxes}</div>
          </div>
        </div>

        {/* Interactive SVG Payoff Chart */}
        <div className="bg-slate-950 border border-slate-800 rounded p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Payoff Profile (₹ P&L vs Underlying Price)</span>
            <div className="flex items-center gap-4 text-[11px] font-normal">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span> Payoff at Expiry
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-cyan-400 border-dashed inline-block"></span> Pre-Expiry Curve
              </span>
            </div>
          </div>

          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
            {/* Zero PnL Reference Line */}
            <line
              x1={padding.left}
              y1={zeroY}
              x2={chartWidth - padding.right}
              y2={zeroY}
              stroke="#475569"
              strokeWidth="1.2"
            />
            <text x={padding.left - 35} y={zeroY + 4} fill="#94a3b8" fontSize="10" fontFamily="'Times New Roman', Times, serif">
              ₹0
            </text>

            {/* Payoff Curves */}
            <path d={expiryPath} fill="none" stroke="#10b981" strokeWidth="2.5" />
            <path d={currentPath} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" />

            {/* Breakeven markers */}
            {data.breakevens.map((be, i) => (
              <g key={i}>
                <line
                  x1={getX(be)}
                  y1={padding.top}
                  x2={getX(be)}
                  y2={chartHeight - padding.bottom}
                  stroke="#f59e0b"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text x={getX(be) - 18} y={chartHeight - 10} fill="#f59e0b" fontSize="9" fontFamily="'Times New Roman', Times, serif">
                  ₹{be}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Greeks Profile Strip */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800/80">
          <div className="text-xs font-semibold text-slate-300 mb-2">Net Greeks Exposure (Overall Portfolio)</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-num">
            <div>
              <span className="text-slate-500">Net Delta:</span>{' '}
              <strong className={data.netGreeks.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {data.netGreeks.delta}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Net Gamma:</span>{' '}
              <strong className="text-slate-200">{data.netGreeks.gamma}</strong>
            </div>
            <div>
              <span className="text-slate-500">Net Theta:</span>{' '}
              <strong className={data.netGreeks.theta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {data.netGreeks.theta > 0 ? '+' : ''}{data.netGreeks.theta}/day
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Net Vega:</span>{' '}
              <strong className="text-slate-200">{data.netGreeks.vega}/%IV</strong>
            </div>
          </div>
        </div>

        {data.riskWarning && (
          <div className="p-3 bg-rose-950/20 border border-rose-800/40 rounded text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{data.riskWarning}</span>
          </div>
        )}
      </div>
    </div>
  );
};
