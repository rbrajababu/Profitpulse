import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Activity,
  LineChart,
  Building2,
  Crosshair,
  Scale,
  Search,
  Sparkles,
  BookmarkCheck,
  History,
  ShieldCheck,
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'option-chain'
  | 'oi-sentiment'
  | 'technicals'
  | 'fundamentals'
  | 'setups'
  | 'strategy-analyzer'
  | 'screener'
  | 'ai-assistant'
  | 'watchlist-journal'
  | 'backtesting'
  | 'admin';

interface NavbarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  isAdmin: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onChangeTab, isAdmin }) => {
  const tabs = [
    { id: 'overview' as ActiveTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'option-chain' as ActiveTab, label: 'Option Chain', icon: Layers },
    { id: 'oi-sentiment' as ActiveTab, label: 'OI Buildup', icon: Activity },
    { id: 'technicals' as ActiveTab, label: 'Technical Charts', icon: LineChart },
    { id: 'fundamentals' as ActiveTab, label: 'Fundamentals', icon: Building2 },
    { id: 'setups' as ActiveTab, label: 'Trading Setups', icon: Crosshair },
    { id: 'strategy-analyzer' as ActiveTab, label: 'Option Payoff', icon: Scale },
    { id: 'screener' as ActiveTab, label: 'Screener', icon: Search },
    { id: 'ai-assistant' as ActiveTab, label: 'AI Quant Research', icon: Sparkles },
    { id: 'watchlist-journal' as ActiveTab, label: 'Watchlist & Journal', icon: BookmarkCheck },
    { id: 'backtesting' as ActiveTab, label: 'Backtesting', icon: History },
    ...(isAdmin ? [{ id: 'admin' as ActiveTab, label: 'Admin Console', icon: ShieldCheck }] : []),
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/60 px-4 flex items-center gap-1 overflow-x-auto text-xs font-medium scrollbar-none">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 border-b-2 transition whitespace-nowrap ${
              isActive
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
