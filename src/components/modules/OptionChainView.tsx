import React, { useState, useEffect } from 'react';
import { OptionChainData, OptionContract } from '../../types/market';
import { getFallbackOptionChain } from '../../services/clientFallbackData';
import { Layers, Download, SlidersHorizontal, ArrowUpDown, ShieldAlert, BarChart2 } from 'lucide-react';

interface OptionChainViewProps {
  symbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const OptionChainView: React.FC<OptionChainViewProps> = ({ symbol, onSelectSymbol }) => {
  const [data, setData] = useState<OptionChainData | null>(() => getFallbackOptionChain(symbol));
  const [loading, setLoading] = useState(false);
  const [showGreeks, setShowGreeks] = useState(false);
  const [strikeFilter, setStrikeFilter] = useState<'all' | 'near_atm' | 'otm_only'>('near_atm');
  const [selectedExpiry, setSelectedExpiry] = useState<string>('27-MAR-2026');

  const fetchChain = async () => {
    try {
      const res = await fetch(`/api/market/option-chain/${symbol}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (!selectedExpiry && json.expiryDate) {
          setSelectedExpiry(json.expiryDate);
        }
      }
    } catch (err) {
      console.warn('Backend option chain unavailable, using fallback data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchChain();
    const interval = setInterval(fetchChain, 3500);
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
        <Layers className="w-4 h-4 animate-spin text-cyan-400" />
        <span>Loading Option Chain for {symbol}...</span>
      </div>
    );
  }

  // Filter strikes
  let filteredStrikes = data.strikes;
  if (strikeFilter === 'near_atm') {
    const atmIndex = data.strikes.findIndex(s => s.strikePrice === data.atmStrike);
    if (atmIndex !== -1) {
      const start = Math.max(0, atmIndex - 7);
      const end = Math.min(data.strikes.length, atmIndex + 8);
      filteredStrikes = data.strikes.slice(start, end);
    }
  } else if (strikeFilter === 'otm_only') {
    filteredStrikes = data.strikes.filter(
      s => (s.strikePrice > data.spotPrice && s.strikePrice <= data.spotPrice * 1.05) ||
           (s.strikePrice < data.spotPrice && s.strikePrice >= data.spotPrice * 0.95)
    );
  }

  const exportChainCsv = () => {
    window.location.href = `/api/reports/export-csv?type=option-chain&symbol=${symbol}`;
  };

  const maxStrikeOi = Math.max(...data.strikes.map(s => Math.max(s.ceOi, s.peOi)), 1);

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Top Header Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Spot Price</div>
          <div className="text-lg font-bold font-mono-num text-white mt-0.5">
            ₹{data.spotPrice.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 font-mono-num">Fut: ₹{data.futuresPrice.toLocaleString('en-IN')}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">ATM Strike</div>
          <div className="text-lg font-bold font-mono-num text-cyan-400 mt-0.5">
            ₹{data.atmStrike.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500">Moneyness anchor</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Max Pain</div>
          <div className="text-lg font-bold font-mono-num text-amber-400 mt-0.5">
            ₹{data.maxPainStrike.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500">Buyer loss min strike</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">PCR (OI)</div>
          <div className={`text-lg font-bold font-mono-num mt-0.5 ${data.pcrOi >= 1.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {data.pcrOi}
          </div>
          <div className="text-[10px] text-slate-500">Vol PCR: {data.pcrVolume}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Call Wall (Resistance)</div>
          <div className="text-lg font-bold font-mono-num text-rose-400 mt-0.5">
            ₹{data.highestCeOiStrike.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500">Highest Call OI</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Put Wall (Support)</div>
          <div className="text-lg font-bold font-mono-num text-emerald-400 mt-0.5">
            ₹{data.highestPeOiStrike.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500">Highest Put OI</div>
        </div>
      </div>

      {/* Control Bar: Expiry, Strike Filter, Greeks Toggle, Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-lg text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Expiry Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Expiry:</span>
            <select
              value={selectedExpiry}
              onChange={e => setSelectedExpiry(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 outline-none"
            >
              {data.availableExpiries.map(exp => (
                <option key={exp} value={exp}>
                  {exp} {exp === data.availableExpiries[0] ? '(Near Weekly)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Strike Filter Segment */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded">
            <button
              onClick={() => setStrikeFilter('near_atm')}
              className={`px-2.5 py-0.5 rounded transition ${
                strikeFilter === 'near_atm' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Near ATM (±7)
            </button>
            <button
              onClick={() => setStrikeFilter('all')}
              className={`px-2.5 py-0.5 rounded transition ${
                strikeFilter === 'all' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Strikes
            </button>
            <button
              onClick={() => setStrikeFilter('otm_only')}
              className={`px-2.5 py-0.5 rounded transition ${
                strikeFilter === 'otm_only' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OTM Only
            </button>
          </div>

          {/* Greeks Toggle */}
          <button
            onClick={() => setShowGreeks(!showGreeks)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded border transition ${
              showGreeks
                ? 'bg-cyan-950 border-cyan-800 text-cyan-400 font-semibold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showGreeks ? 'Hide Greeks' : 'Show Greeks (Delta, Theta, Vega)'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportChainCsv}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Graphical Strike OI Distribution Visualizer */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
          <span className="flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
            Strike-wise Open Interest Distribution (CE Resistance vs PE Support)
          </span>
          <div className="flex items-center gap-4 text-[11px] font-normal">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm inline-block"></span> Call OI (Resistance)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block"></span> Put OI (Support)
            </span>
          </div>
        </div>

        <div className="space-y-1 pt-1">
          {filteredStrikes.map(s => {
            const isAtm = s.strikePrice === data.atmStrike;
            const ceWidth = (s.ceOi / maxStrikeOi) * 100;
            const peWidth = (s.peOi / maxStrikeOi) * 100;

            return (
              <div key={s.strikePrice} className={`flex items-center text-[10px] font-mono-num py-0.5 px-1 rounded ${isAtm ? 'bg-cyan-950/40 border border-cyan-800/60' : ''}`}>
                {/* CE OI bar on left (reversed) */}
                <div className="flex-1 flex justify-end items-center gap-1.5 pr-2">
                  <span className="text-slate-400 text-[9px]">{(s.ceOi / 1000).toFixed(0)}k</span>
                  <div className="w-32 bg-slate-800/80 h-2.5 rounded-sm overflow-hidden flex justify-end">
                    <div className="bg-rose-500/80 h-full rounded-sm" style={{ width: `${ceWidth}%` }}></div>
                  </div>
                </div>

                {/* Strike Price Badge */}
                <div className={`w-16 text-center font-bold ${isAtm ? 'text-cyan-400' : 'text-slate-200'}`}>
                  {s.strikePrice} {isAtm ? '•' : ''}
                </div>

                {/* PE OI bar on right */}
                <div className="flex-1 flex items-center gap-1.5 pl-2">
                  <div className="w-32 bg-slate-800/80 h-2.5 rounded-sm overflow-hidden">
                    <div className="bg-emerald-500/80 h-full rounded-sm" style={{ width: `${peWidth}%` }}></div>
                  </div>
                  <span className="text-slate-400 text-[9px]">{(s.peOi / 1000).toFixed(0)}k</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Option Chain Table */}
      <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-900/90 shadow-xl">
        <table className="w-full text-[11px] text-center border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-semibold">
              <th colSpan={showGreeks ? 9 : 6} className="py-2 px-3 text-rose-400 bg-rose-950/20 border-r border-slate-800">
                CALL OPTIONS (CE)
              </th>
              <th className="py-2 px-4 text-cyan-400 bg-slate-900 border-r border-slate-800">
                STRIKE
              </th>
              <th colSpan={showGreeks ? 9 : 6} className="py-2 px-3 text-emerald-400 bg-emerald-950/20">
                PUT OPTIONS (PE)
              </th>
            </tr>
            <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800 text-[10px] font-medium font-mono-num">
              {/* CE Headers */}
              <th className="py-1.5 px-2">OI</th>
              <th className="py-1.5 px-2">Chg OI</th>
              <th className="py-1.5 px-2">Vol</th>
              <th className="py-1.5 px-2">IV%</th>
              <th className="py-1.5 px-2">LTP</th>
              <th className="py-1.5 px-2 border-r border-slate-800">Chg</th>
              {showGreeks && (
                <>
                  <th className="py-1.5 px-1.5 text-cyan-400">Delta</th>
                  <th className="py-1.5 px-1.5 text-cyan-400">Theta</th>
                  <th className="py-1.5 px-1.5 text-cyan-400 border-r border-slate-800">Vega</th>
                </>
              )}

              {/* Strike Header */}
              <th className="py-1.5 px-4 bg-slate-900/80 text-white font-bold border-r border-slate-800">
                PRICE
              </th>

              {/* PE Headers */}
              {showGreeks && (
                <>
                  <th className="py-1.5 px-1.5 text-cyan-400">Delta</th>
                  <th className="py-1.5 px-1.5 text-cyan-400">Theta</th>
                  <th className="py-1.5 px-1.5 text-cyan-400">Vega</th>
                </>
              )}
              <th className="py-1.5 px-2">LTP</th>
              <th className="py-1.5 px-2">Chg</th>
              <th className="py-1.5 px-2">IV%</th>
              <th className="py-1.5 px-2">Vol</th>
              <th className="py-1.5 px-2">Chg OI</th>
              <th className="py-1.5 px-2">OI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono-num">
            {filteredStrikes.map(strike => {
              const isAtm = strike.strikePrice === data.atmStrike;
              const isCallItm = strike.strikePrice < data.spotPrice;
              const isPutItm = strike.strikePrice > data.spotPrice;

              return (
                <tr
                  key={strike.strikePrice}
                  className={`hover:bg-slate-800/50 transition ${
                    isAtm ? 'bg-cyan-950/30 font-semibold' : ''
                  }`}
                >
                  {/* CE Columns */}
                  <td className={`py-1.5 px-2 text-slate-300 ${isCallItm ? 'bg-amber-950/15' : ''}`}>
                    {strike.ceOi.toLocaleString('en-IN')}
                  </td>
                  <td className={`py-1.5 px-2 ${isCallItm ? 'bg-amber-950/15' : ''} ${strike.ceOiChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {strike.ceOiChange >= 0 ? '+' : ''}{strike.ceOiChange.toLocaleString('en-IN')}
                  </td>
                  <td className={`py-1.5 px-2 text-slate-400 ${isCallItm ? 'bg-amber-950/15' : ''}`}>
                    {strike.ceVolume.toLocaleString('en-IN')}
                  </td>
                  <td className={`py-1.5 px-2 text-slate-400 ${isCallItm ? 'bg-amber-950/15' : ''}`}>
                    {strike.ceIv}%
                  </td>
                  <td className={`py-1.5 px-2 font-bold text-slate-100 ${isCallItm ? 'bg-amber-950/20' : ''}`}>
                    ₹{strike.ceLtp.toFixed(2)}
                  </td>
                  <td className={`py-1.5 px-2 border-r border-slate-800 ${isCallItm ? 'bg-amber-950/15' : ''} ${strike.ceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {strike.ceChange >= 0 ? '+' : ''}{strike.ceChange.toFixed(2)}
                  </td>

                  {showGreeks && (
                    <>
                      <td className="py-1.5 px-1.5 text-slate-300">{strike.ceDelta}</td>
                      <td className="py-1.5 px-1.5 text-slate-300">{strike.ceTheta}</td>
                      <td className="py-1.5 px-1.5 text-slate-300 border-r border-slate-800">{strike.ceVega}</td>
                    </>
                  )}

                  {/* STRIKE CELL */}
                  <td className={`py-1.5 px-4 font-bold border-r border-slate-800 ${isAtm ? 'bg-cyan-900/60 text-cyan-300 ring-1 ring-cyan-500' : 'bg-slate-950 text-white'}`}>
                    {strike.strikePrice}
                  </td>

                  {/* PE Columns */}
                  {showGreeks && (
                    <>
                      <td className="py-1.5 px-1.5 text-slate-300">{strike.peDelta}</td>
                      <td className="py-1.5 px-1.5 text-slate-300">{strike.peTheta}</td>
                      <td className="py-1.5 px-1.5 text-slate-300">{strike.peVega}</td>
                    </>
                  )}

                  <td className={`py-1.5 px-2 font-bold text-slate-100 ${isPutItm ? 'bg-amber-950/20' : ''}`}>
                    ₹{strike.peLtp.toFixed(2)}
                  </td>
                  <td className={`py-1.5 px-2 ${isPutItm ? 'bg-amber-950/15' : ''} ${strike.peChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {strike.peChange >= 0 ? '+' : ''}{strike.peChange.toFixed(2)}
                  </td>
                  <td className={`py-1.5 px-2 text-slate-400 ${isPutItm ? 'bg-amber-950/15' : ''}`}>
                    {strike.peIv}%
                  </td>
                  <td className={`py-1.5 px-2 text-slate-400 ${isPutItm ? 'bg-amber-950/15' : ''}`}>
                    {strike.peVolume.toLocaleString('en-IN')}
                  </td>
                  <td className={`py-1.5 px-2 ${isPutItm ? 'bg-amber-950/15' : ''} ${strike.peOiChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {strike.peOiChange >= 0 ? '+' : ''}{strike.peOiChange.toLocaleString('en-IN')}
                  </td>
                  <td className={`py-1.5 px-2 text-slate-300 ${isPutItm ? 'bg-amber-950/15' : ''}`}>
                    {strike.peOi.toLocaleString('en-IN')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 p-3 bg-slate-900/60 border border-slate-800 rounded text-xs text-slate-400">
        <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <strong>Quantitative Insight:</strong> Shaded rows mark In-The-Money (ITM) contracts. Strikes with the highest CE Open Interest often represent overhead call resistance walls, while high PE OI represents downside put floors. High open interest does not guarantee a price pivot.
        </span>
      </div>
    </div>
  );
};
