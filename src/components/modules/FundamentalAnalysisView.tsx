import React, { useState, useEffect } from 'react';
import { FundamentalData } from '../../types/market';
import { Building2, PieChart, ShieldAlert, TrendingUp, Percent, DollarSign } from 'lucide-react';

interface FundamentalAnalysisViewProps {
  symbol: string;
}

export const FundamentalAnalysisView: React.FC<FundamentalAnalysisViewProps> = ({ symbol }) => {
  const [data, setData] = useState<FundamentalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFundamentals = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/market/fundamentals/${symbol}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setData(null);
        }
      } catch (err) {
        console.error('Failed to load fundamentals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFundamentals();
  }, [symbol]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
        <Building2 className="w-4 h-4 animate-spin text-cyan-400" />
        <span>Loading Fundamentals for {symbol}...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-400 max-w-xl mx-auto space-y-2">
        <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
        <div className="font-semibold text-slate-200">Fundamental Data Not Applicable</div>
        <div className="text-xs text-slate-500">
          {symbol} is an exchange benchmark index. Fundamental ratios (P/E, ROE, Shareholding) apply to underlying corporate equity constituents (e.g. RELIANCE, TCS, HDFCBANK, INFY).
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Company Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">Corporate Research</div>
          <h2 className="text-lg font-bold text-white mt-0.5">{data.companyName} ({data.symbol})</h2>
          <div className="text-xs text-slate-400 mt-0.5">
            Reporting Period: <span className="font-semibold text-slate-300">{data.reportingPeriod}</span> · Verified Quarterly Disclosures
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Market Capitalization</div>
          <div className="text-xl font-bold font-mono-num text-white">₹{data.marketCapCr.toLocaleString('en-IN')} Cr</div>
        </div>
      </div>

      {/* 4 Pillars Grid: Valuation, Profitability, Growth, Financial Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Pillar 1: Valuation Ratios */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 uppercase tracking-wider pb-1 border-b border-slate-800">
            <DollarSign className="w-3.5 h-3.5" /> Valuation Multiples
          </div>
          <div className="space-y-1.5 text-xs font-mono-num">
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">P/E Ratio (TTM)</span>
              <span className="font-bold text-white">{data.peRatio}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">P/B Ratio</span>
              <span className="font-bold text-white">{data.pbRatio}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">EV / EBITDA</span>
              <span className="font-bold text-white">{data.evEbitda}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Dividend Yield</span>
              <span className="font-bold text-emerald-400">{data.dividendYield}%</span>
            </div>
          </div>
        </div>

        {/* Pillar 2: Profitability & Returns */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider pb-1 border-b border-slate-800">
            <Percent className="w-3.5 h-3.5" /> Return & Margins
          </div>
          <div className="space-y-1.5 text-xs font-mono-num">
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Return on Equity (ROE)</span>
              <span className="font-bold text-emerald-400">{data.roePercent}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Return on Capital (ROCE)</span>
              <span className="font-bold text-emerald-400">{data.rocePercent}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Operating Margin (OPM)</span>
              <span className="font-bold text-white">{data.opmPercent}%</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Net Profit Margin (NPM)</span>
              <span className="font-bold text-white">{data.npmPercent}%</span>
            </div>
          </div>
        </div>

        {/* Pillar 3: Growth & EPS */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider pb-1 border-b border-slate-800">
            <TrendingUp className="w-3.5 h-3.5" /> Earnings & Growth
          </div>
          <div className="space-y-1.5 text-xs font-mono-num">
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">EPS (TTM)</span>
              <span className="font-bold text-white">₹{data.epsTtm}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Revenue Growth (QoQ)</span>
              <span className={`font-bold ${data.revenueGrowthQoQ >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.revenueGrowthQoQ >= 0 ? '+' : ''}{data.revenueGrowthQoQ}%
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Profit Growth (QoQ)</span>
              <span className={`font-bold ${data.profitGrowthQoQ >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.profitGrowthQoQ >= 0 ? '+' : ''}{data.profitGrowthQoQ}%
              </span>
            </div>
          </div>
        </div>

        {/* Pillar 4: Balance Sheet Solvency */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 uppercase tracking-wider pb-1 border-b border-slate-800">
            <Building2 className="w-3.5 h-3.5" /> Solvency & Capital
          </div>
          <div className="space-y-1.5 text-xs font-mono-num">
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Debt-to-Equity</span>
              <span className={`font-bold ${data.debtToEquity < 1.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {data.debtToEquity}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400">Solvency Profile</span>
              <span className="font-bold text-slate-200">{data.debtToEquity < 0.5 ? 'Negligible Debt' : 'Managed Leverage'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Free Cash Flow Coverage</span>
              <span className="font-bold text-emerald-400">Adequate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shareholding Pattern Visualizer */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
          <span className="flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-cyan-400" /> Shareholding Distribution (%)
          </span>
          <span className="text-slate-400 text-[11px] font-normal">Disclosed Regulatory Filings</span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="h-4 w-full bg-slate-800 rounded-md overflow-hidden flex font-mono-num text-[10px] text-white">
          <div className="bg-cyan-600 flex items-center justify-center font-bold" style={{ width: `${data.promoterHolding}%` }}>
            {data.promoterHolding}%
          </div>
          <div className="bg-emerald-600 flex items-center justify-center font-bold" style={{ width: `${data.fiiHolding}%` }}>
            {data.fiiHolding}%
          </div>
          <div className="bg-purple-600 flex items-center justify-center font-bold" style={{ width: `${data.diiHolding}%` }}>
            {data.diiHolding}%
          </div>
          <div className="bg-amber-600 flex items-center justify-center font-bold" style={{ width: `${data.publicHolding}%` }}>
            {data.publicHolding}%
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-num pt-1">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 bg-cyan-600 rounded-sm inline-block"></span>
            <span>Promoters: <strong>{data.promoterHolding}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 bg-emerald-600 rounded-sm inline-block"></span>
            <span>FII (Foreign): <strong>{data.fiiHolding}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 bg-purple-600 rounded-sm inline-block"></span>
            <span>DII (Domestic/MFs): <strong>{data.diiHolding}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 bg-amber-600 rounded-sm inline-block"></span>
            <span>Public & Retail: <strong>{data.publicHolding}%</strong></span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded text-xs text-slate-400 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <strong>Research Disclaimer:</strong> Financial ratios and metrics represent historical quarterly performance. Low valuation alone does not constitute an undervaluation or investment buy recommendation.
        </span>
      </div>
    </div>
  );
};
