import React, { useState, useEffect, useRef } from 'react';
import { Candle, TechnicalIndicators } from '../../types/market';
import { LineChart, CheckSquare, Square, Eye, EyeOff, Sliders, TrendingUp, Info } from 'lucide-react';

interface TechnicalAnalysisViewProps {
  symbol: string;
}

export const TechnicalAnalysisView: React.FC<TechnicalAnalysisViewProps> = ({ symbol }) => {
  const [timeframe, setTimeframe] = useState<string>('15m');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [loading, setLoading] = useState(true);

  // Indicator Visibility Toggles
  const [showEma9, setShowEma9] = useState(true);
  const [showEma20, setShowEma20] = useState(true);
  const [showEma50, setShowEma50] = useState(false);
  const [showVwap, setShowVwap] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showSr, setShowSr] = useState(true);
  const [activeSubchart, setActiveSubchart] = useState<'rsi' | 'macd'>('rsi');

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const fetchTechData = async () => {
    try {
      const [candleRes, indRes] = await fetchAllPromises([
        fetch(`/api/market/candles/${symbol}?timeframe=${timeframe}`),
        fetch(`/api/market/indicators/${symbol}?timeframe=${timeframe}`),
      ]);

      if (candleRes.ok) {
        const cJson = await candleRes.json();
        setCandles(cJson);
      }
      if (indRes.ok) {
        const iJson = await indRes.json();
        setIndicators(iJson);
      }
    } catch (err) {
      console.error('Failed to load technical data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPromises = async (promises: Promise<Response>[]) => {
    return Promise.all(promises);
  };

  useEffect(() => {
    setLoading(true);
    fetchTechData();
    const interval = setInterval(fetchTechData, 4000);
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  if (loading || candles.length === 0 || !indicators) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
        <LineChart className="w-4 h-4 animate-spin text-cyan-400" />
        <span>Loading Interactive Chart & Indicators for {symbol}...</span>
      </div>
    );
  }

  // Chart Dimensions & Scaling
  const chartHeight = 340;
  const chartWidth = 900;
  const padding = { top: 20, right: 60, bottom: 25, left: 10 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const visibleCandles = candles.slice(-45);
  const candleCount = visibleCandles.length;
  const candleWidth = Math.max(4, Math.floor(innerWidth / candleCount) - 3);

  const prices = visibleCandles.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...prices) * 0.998;
  const maxPrice = Math.max(...prices) * 1.002;
  const priceRange = maxPrice - minPrice || 1;

  const getY = (val: number) => {
    return padding.top + innerHeight - ((val - minPrice) / priceRange) * innerHeight;
  };

  const getX = (index: number) => {
    return padding.left + index * (innerWidth / candleCount) + candleWidth / 2;
  };

  // Hovered candle data
  const activeCandle = hoverIndex !== null && visibleCandles[hoverIndex] ? visibleCandles[hoverIndex] : visibleCandles[visibleCandles.length - 1];

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Top Technical Diagnostic Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Composite Technical Score</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className={`text-xl font-bold font-mono-num ${indicators.compositeScore > 0 ? 'text-emerald-400' : indicators.compositeScore < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
              {indicators.compositeScore > 0 ? '+' : ''}{indicators.compositeScore} / 100
            </span>
            <span className="text-xs text-slate-400 font-medium">({indicators.sentimentLabel})</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Weight: Trend 30%, RSI 25%, MACD 20%, VWAP 15%</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Relative Strength vs NIFTY</div>
          <div className={`text-xl font-bold font-mono-num mt-0.5 ${indicators.relativeStrengthVsNifty >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
            {indicators.relativeStrengthVsNifty >= 0 ? '+' : ''}{indicators.relativeStrengthVsNifty}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">20-period performance differential</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Intraday VWAP & ATR (14)</div>
          <div className="text-xl font-bold font-mono-num text-white mt-0.5">
            ₹{indicators.vwap}
          </div>
          <div className="text-[10px] text-slate-500 font-mono-num mt-0.5">ATR: ₹{indicators.atr14}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Key Pivot Levels</div>
          <div className="text-xs font-mono-num mt-1 flex flex-col gap-0.5">
            <span className="text-rose-400">R: {indicators.resistanceLevels.slice(0, 2).map(r => `₹${r}`).join(' | ')}</span>
            <span className="text-emerald-400">S: {indicators.supportLevels.slice(0, 2).map(s => `₹${s}`).join(' | ')}</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Timeframe & Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs">
        {/* Timeframe selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded">
          {['1m', '5m', '15m', '1h', 'D', 'W'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-0.5 rounded font-mono-num font-medium transition ${
                timeframe === tf ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Indicator Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowEma9(!showEma9)}
            className={`px-2 py-0.5 rounded border transition flex items-center gap-1 font-mono-num ${
              showEma9 ? 'bg-amber-950/40 border-amber-600 text-amber-300 font-semibold' : 'border-slate-800 text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> 9 EMA
          </button>

          <button
            onClick={() => setShowEma20(!showEma20)}
            className={`px-2 py-0.5 rounded border transition flex items-center gap-1 font-mono-num ${
              showEma20 ? 'bg-blue-950/40 border-blue-600 text-blue-300 font-semibold' : 'border-slate-800 text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span> 20 EMA
          </button>

          <button
            onClick={() => setShowVwap(!showVwap)}
            className={`px-2 py-0.5 rounded border transition flex items-center gap-1 font-mono-num ${
              showVwap ? 'bg-purple-950/40 border-purple-600 text-purple-300 font-semibold' : 'border-slate-800 text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span> VWAP
          </button>

          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-2 py-0.5 rounded border transition flex items-center gap-1 font-mono-num ${
              showBollinger ? 'bg-cyan-950/40 border-cyan-600 text-cyan-300 font-semibold' : 'border-slate-800 text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span> Bollinger
          </button>

          <button
            onClick={() => setShowSr(!showSr)}
            className={`px-2 py-0.5 rounded border transition flex items-center gap-1 font-mono-num ${
              showSr ? 'bg-emerald-950/40 border-emerald-600 text-emerald-300 font-semibold' : 'border-slate-800 text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> S/R Zones
          </button>
        </div>

        {/* Subchart toggle (RSI or MACD) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded">
          <button
            onClick={() => setActiveSubchart('rsi')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
              activeSubchart === 'rsi' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            RSI (14)
          </button>
          <button
            onClick={() => setActiveSubchart('macd')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
              activeSubchart === 'macd' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            MACD
          </button>
        </div>
      </div>

      {/* Main Interactive Candlestick Chart SVG Canvas */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 relative shadow-inner overflow-hidden">
        {/* Hover Readout Bar */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono-num text-slate-300 mb-2 pb-1.5 border-b border-slate-900">
          <span className="font-bold text-white">{symbol} ({timeframe})</span>
          <span>O: <strong className="text-white">₹{activeCandle.open}</strong></span>
          <span>H: <strong className="text-white">₹{activeCandle.high}</strong></span>
          <span>L: <strong className="text-white">₹{activeCandle.low}</strong></span>
          <span>C: <strong className={activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}>₹{activeCandle.close}</strong></span>
          <span>Vol: {(activeCandle.volume / 1000).toFixed(1)}k</span>
          <span className="text-slate-500 ml-auto">{new Date(activeCandle.time).toLocaleTimeString('en-IN')}</span>
        </div>

        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(fraction => {
            const y = padding.top + fraction * innerHeight;
            const p = maxPrice - fraction * priceRange;
            return (
              <g key={fraction}>
                <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={chartWidth - padding.right + 6} y={y + 4} fill="#64748b" fontSize="10" fontFamily="'Times New Roman', Times, serif">
                  ₹{p.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* S/R Lines */}
          {showSr && indicators.resistanceLevels.slice(0, 1).map((r, i) => (
            <line
              key={`r_${i}`}
              x1={padding.left}
              y1={getY(r)}
              x2={chartWidth - padding.right}
              y2={getY(r)}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth="1.2"
            />
          ))}
          {showSr && indicators.supportLevels.slice(0, 1).map((s, i) => (
            <line
              key={`s_${i}`}
              x1={padding.left}
              y1={getY(s)}
              x2={chartWidth - padding.right}
              y2={getY(s)}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth="1.2"
            />
          ))}

          {/* VWAP Horizontal Reference */}
          {showVwap && (
            <line
              x1={padding.left}
              y1={getY(indicators.vwap)}
              x2={chartWidth - padding.right}
              y2={getY(indicators.vwap)}
              stroke="#c084fc"
              strokeWidth="1.5"
            />
          )}

          {/* Candlesticks Rendering */}
          {visibleCandles.map((c, i) => {
            const x = getX(i);
            const isBull = c.close >= c.open;
            const openY = getY(c.open);
            const closeY = getY(c.close);
            const highY = getY(c.high);
            const lowY = getY(c.low);
            const topY = Math.min(openY, closeY);
            const bodyHeight = Math.max(2, Math.abs(openY - closeY));
            const color = isBull ? '#10b981' : '#ef4444';

            return (
              <g
                key={i}
                onMouseEnter={() => setHoverIndex(i)}
                className="transition-opacity"
              >
                {/* Wick */}
                <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1.2" />
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={topY}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={color}
                  rx="1"
                />
              </g>
            );
          })}

          {/* Active Hover Crosshair */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={padding.top + innerHeight}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1={padding.left}
                y1={getY(visibleCandles[hoverIndex].close)}
                x2={chartWidth - padding.right}
                y2={getY(visibleCandles[hoverIndex].close)}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </g>
          )}
        </svg>

        {/* Sub-chart (RSI or MACD) */}
        <div className="mt-3 pt-2 border-t border-slate-900">
          <div className="flex items-center justify-between text-[10px] font-mono-num text-slate-400 mb-1">
            <span>
              {activeSubchart === 'rsi'
                ? `RSI (14): ${indicators.rsi14} ${indicators.rsi14 > 70 ? '(Overbought)' : indicators.rsi14 < 30 ? '(Oversold)' : '(Neutral)'}`
                : `MACD: Line ${indicators.macd.macdLine} | Signal ${indicators.macd.signalLine} | Hist ${indicators.macd.histogram}`}
            </span>
            <span className="text-slate-500">Sub-Indicator Oscillator</span>
          </div>

          <div className="h-16 w-full bg-slate-900/60 rounded flex items-center justify-center p-2 relative overflow-hidden">
            {activeSubchart === 'rsi' ? (
              <div className="w-full h-full flex flex-col justify-between relative">
                <div className="border-b border-rose-500/30 w-full text-[8px] text-rose-400 flex justify-end pr-1">70 OB</div>
                <div className="w-full h-1 bg-slate-800 rounded-full my-auto overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, indicators.rsi14))}%` }}
                  />
                </div>
                <div className="border-t border-emerald-500/30 w-full text-[8px] text-emerald-400 flex justify-end pr-1">30 OS</div>
              </div>
            ) : (
              <div className="flex items-center gap-1 w-full justify-center h-full">
                <div className={`h-8 w-12 rounded flex items-center justify-center text-xs font-mono-num font-bold ${indicators.macd.histogram >= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                  {indicators.macd.histogram >= 0 ? '+' : ''}{indicators.macd.histogram}
                </div>
                <div className="text-[10px] text-slate-400 font-mono-num">
                  Histogram momentum is {indicators.macd.histogram > 0 ? 'expanding positively' : 'depressed'}.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
