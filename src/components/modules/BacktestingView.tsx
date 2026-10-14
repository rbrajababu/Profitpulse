import React, { useState, useEffect } from 'react';
import { BacktestSummary, BacktestConfig, Instrument } from '../../types/market';
import { History, Play, ShieldAlert, TrendingUp, DollarSign, Activity, Percent } from 'lucide-react';

interface BacktestingViewProps {
  instruments: Instrument[];
}

export const BacktestingView: React.FC<BacktestingViewProps> = ({ instruments }) => {
  const [config, setConfig] = useState<BacktestConfig>({
    symbol: 'NIFTY',
    strategyId: 'ema_crossover',
    timeframe: 'D',
    startDate: '2026-01-01',
    endDate: '2026-10-12',
    initialCapital: 100000,
    riskPerTradePercent: 2,
    slippagePercent: 0.05,
    brokeragePerTrade: 40,
  });

  const [summary, setSummary] = useState<BacktestSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const runBacktest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        const json = await res.json();
        setSummary(json);
      }
    } catch (err) {
      console.error('Failed to run backtest:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBacktest();
  }, []);

  // Equity Curve SVG dimensions
  const chartHeight = 220;
  const chartWidth = 720;
  const padding = { top: 20, right: 30, bottom: 25, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  let equityPath = '';
  let minBal = 90000;
  let maxBal = 120000;

  if (summary && summary.equityCurve.length > 0) {
    const balances = summary.equityCurve.map(e => e.balance);
    minBal = Math.min(...balances, config.initialCapital * 0.95);
    maxBal = Math.max(...balances, config.initialCapital * 1.05);
    const balRange = maxBal - minBal || 1;

    const count = summary.equityCurve.length;
    equityPath = summary.equityCurve
      .map((pt, i) => {
        const x = padding.left + (i / (count - 1 || 1)) * innerWidth;
        const y = padding.top + innerHeight - ((pt.balance - minBal) / balRange) * innerHeight;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Configuration Strip */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Quantitative Strategy Backtesting Engine</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono-num">
            Realistic Indian F&O Slippage & STT Deductions Enabled
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-slate-400 text-[11px] font-medium">Instrument</label>
            <select
              value={config.symbol}
              onChange={e => setConfig({ ...config, symbol: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white outline-none mt-1 font-semibold"
            >
              {instruments.map(i => (
                <option key={i.symbol} value={i.symbol}>
                  {i.symbol} ({i.segment})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 text-[11px] font-medium">Rule Strategy</label>
            <select
              value={config.strategyId}
              onChange={e => setConfig({ ...config, strategyId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white outline-none mt-1"
            >
              <option value="ema_crossover">EMA 9 / 20 Trend Follow + RSI Filter</option>
              <option value="vwap_breakout">VWAP Momentum Breakout</option>
              <option value="mean_reversion">Bollinger Mean Reversion</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 text-[11px] font-medium">Initial Capital (₹)</label>
            <input
              type="number"
              value={config.initialCapital}
              onChange={e => setConfig({ ...config, initialCapital: parseFloat(e.target.value) || 100000 })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white outline-none mt-1 font-mono-num"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={runBacktest}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded transition shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loading ? 'Simulating...' : 'Run Simulation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Workspace */}
      {summary && (
        <div className="space-y-4">
          {/* Performance Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono-num text-xs">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase">Net Realized P&L</div>
              <div className={`text-lg font-bold mt-0.5 ${summary.netPnlAfterCharges >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {summary.netPnlAfterCharges >= 0 ? '+' : ''}₹{summary.netPnlAfterCharges.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase">Win Rate</div>
              <div className="text-lg font-bold text-cyan-400 mt-0.5">{summary.winRate}%</div>
              <div className="text-[10px] text-slate-500">{summary.winningTrades}W / {summary.losingTrades}L</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase">Profit Factor</div>
              <div className="text-lg font-bold text-white mt-0.5">{summary.profitFactor}</div>
              <div className="text-[10px] text-slate-500">Gross Win / Gross Loss</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase">Max Drawdown</div>
              <div className="text-lg font-bold text-rose-400 mt-0.5">-{summary.maxDrawdownPercent}%</div>
              <div className="text-[10px] text-slate-500">Peak-to-trough risk</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase">Total Executions</div>
              <div className="text-lg font-bold text-white mt-0.5">{summary.totalTrades}</div>
              <div className="text-[10px] text-slate-500">Historical triggers</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-slate-500 uppercase">Expectancy / Trade</div>
              <div className={`text-lg font-bold mt-0.5 ${summary.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{summary.expectancy}
              </div>
            </div>
          </div>

          {/* Interactive SVG Equity Curve */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                Portfolio Equity Growth Curve (After Brokerage & Taxes)
              </span>
              <span className="text-[11px] text-slate-500 font-mono-num font-normal">
                Base Capital: ₹{config.initialCapital.toLocaleString('en-IN')}
              </span>
            </div>

            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto bg-slate-950 rounded p-1">
              {/* Baseline Capital */}
              <line
                x1={padding.left}
                y1={padding.top + innerHeight - ((config.initialCapital - minBal) / (maxBal - minBal)) * innerHeight}
                x2={chartWidth - padding.right}
                y2={padding.top + innerHeight - ((config.initialCapital - minBal) / (maxBal - minBal)) * innerHeight}
                stroke="#475569"
                strokeDasharray="3 3"
              />

              {/* Equity Line */}
              {equityPath && (
                <path d={equityPath} fill="none" stroke="#38bdf8" strokeWidth="2" />
              )}
            </svg>
          </div>

          {/* Trade-by-trade breakdown table */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
            <div className="p-3 text-xs font-semibold text-slate-200 border-b border-slate-800">
              Execution History & Fill Quality
            </div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] uppercase text-slate-400 font-semibold">
                  <th className="py-2 px-3">Entry Date</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Entry Price</th>
                  <th className="py-2 px-3">Exit Date</th>
                  <th className="py-2 px-3">Exit Price</th>
                  <th className="py-2 px-3">Return %</th>
                  <th className="py-2 px-3">Net P&L</th>
                  <th className="py-2 px-3">Exit Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-num">
                {summary.trades.map(trade => (
                  <tr key={trade.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 text-slate-300">{trade.date}</td>
                    <td className="py-2 px-3 font-bold text-emerald-400">{trade.type}</td>
                    <td className="py-2 px-3 text-slate-200">₹{trade.entryPrice}</td>
                    <td className="py-2 px-3 text-slate-300">{trade.exitDate}</td>
                    <td className="py-2 px-3 text-slate-200">₹{trade.exitPrice}</td>
                    <td className={`py-2 px-3 font-bold ${trade.returnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.returnPercent >= 0 ? '+' : ''}{trade.returnPercent}%
                    </td>
                    <td className={`py-2 px-3 font-bold ${trade.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {trade.netPnl >= 0 ? '+' : ''}₹{trade.netPnl.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                        {trade.reason}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded text-xs text-slate-400 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <strong>Backtest Realism & Verification:</strong> Backtests factor in execution slippage and exchange charges. Historical performance does not guarantee future results or eliminate market gap risk.
        </span>
      </div>
    </div>
  );
};
