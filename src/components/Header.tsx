import React from 'react';
import { Compass, Sparkles, Heart, Activity, Globe } from 'lucide-react';
import { SupportedCurrency } from '../types/travel.ts';
import { CURRENCY_RATES } from '../utils/travelUtils.ts';

interface HeaderProps {
  favoritesCount: number;
  onOpenFavorites: () => void;
  onOpenMcpInspector: () => void;
  onSurpriseMe: () => void;
  isGenerating: boolean;
  selectedCurrency: SupportedCurrency;
  onCurrencyChange: (currency: SupportedCurrency) => void;
}

export const Header: React.FC<HeaderProps> = ({
  favoritesCount,
  onOpenFavorites,
  onOpenMcpInspector,
  onSurpriseMe,
  isGenerating,
  selectedCurrency,
  onCurrencyChange,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-amber-900/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-800/15">
            <Compass className="w-6 h-6 animate-[spin_24s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-tight text-stone-900">
                Wanderlust <span className="text-amber-700 italic font-normal">AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-amber-100 text-amber-800 border border-amber-200">
                Live LLM + MCP
              </span>
            </div>
            <p className="text-xs text-stone-700 hidden sm:block">
              Hyper-tailored vacation ideas generated on the fly
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Surprise Me Quick Action */}
          <button
            onClick={onSurpriseMe}
            disabled={isGenerating}
            title="Generate 3 curated, off-the-beaten-path destinations right now"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs sm:text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span className="font-medium">Surprise Me</span>
          </button>

          {/* Currency Switcher */}
          <div className="relative inline-flex items-center">
            <Globe className="w-3.5 h-3.5 absolute left-2.5 text-stone-600 pointer-events-none" />
            <select
              value={selectedCurrency}
              onChange={(e) => onCurrencyChange(e.target.value as SupportedCurrency)}
              className="pl-7 pr-3 py-1.5 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200/80 border border-stone-200 text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition-colors"
            >
              {(Object.keys(CURRENCY_RATES) as SupportedCurrency[]).map((cur) => (
                <option key={cur} value={cur}>
                  {cur} ({CURRENCY_RATES[cur].symbol})
                </option>
              ))}
            </select>
          </div>

          {/* MCP Tools Inspector Button */}
          <button
            onClick={onOpenMcpInspector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/50 text-xs text-stone-700 font-medium transition-all cursor-pointer shadow-xs"
            title="Inspect Model Context Protocol (MCP) server status & tool execution"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden md:inline font-mono text-[11px] text-stone-600">MCP Active</span>
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
          </button>

          {/* Favorites Drawer Toggle */}
          <button
            onClick={onOpenFavorites}
            className="relative flex items-center justify-center p-2 rounded-xl border border-stone-200 hover:border-rose-300 bg-white hover:bg-rose-50/50 text-stone-700 transition-all cursor-pointer shadow-xs"
            title="View saved destinations"
          >
            <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-stone-600'}`} />
            {favoritesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4.5 min-w-4.5 px-1 flex items-center justify-center shadow-xs">
                {favoritesCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
