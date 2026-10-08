/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  MapPin,
  RefreshCw,
  AlertCircle,
  Heart,
  Globe2,
  PlaneTakeoff,
  Award,
} from 'lucide-react';
import {
  DestinationItem,
  GenerateTripsResponse,
  McpToolInvocation,
  SearchPreferences,
  SupportedCurrency,
} from './types/travel.ts';
import { Header } from './components/Header.tsx';
import { FilterPanel } from './components/FilterPanel.tsx';
import { LoadingState } from './components/LoadingState.tsx';
import { DestinationCard } from './components/DestinationCard.tsx';
import { DestinationModal } from './components/DestinationModal.tsx';
import { FavoritesDrawer } from './components/FavoritesDrawer.tsx';
import { McpInspectorModal } from './components/McpInspectorModal.tsx';
import { Toast, ToastMessage } from './components/Toast.tsx';
import {
  downloadMarkdownFile,
  exportDestinationToMarkdown,
} from './utils/travelUtils.ts';

const DEFAULT_PREFERENCES: SearchPreferences = {
  persona: 'adventure',
  budgetTier: 'balanced',
  groupDynamic: 'couple',
  tripLength: 'week',
  customTripDays: 7,
  travelTiming: 'Spring (Mar - May)',
  originCity: 'New York (JFK)',
  maxFlightDuration: 'under8',
  climateBias: 'warm',
  customNotes: '',
};

export default function App() {
  // State: Preferences & Results
  const [preferences, setPreferences] = useState<SearchPreferences>(() => {
    try {
      const saved = localStorage.getItem('wanderlust_preferences');
      return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const [destinations, setDestinations] = useState<DestinationItem[]>([]);
  const [mcpTrace, setMcpTrace] = useState<McpToolInvocation[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState<boolean>(true);

  // Currency
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(() => {
    try {
      return (localStorage.getItem('wanderlust_currency') as SupportedCurrency) || 'USD';
    } catch {
      return 'USD';
    }
  });

  // Favorites (LocalStorage)
  const [favorites, setFavorites] = useState<DestinationItem[]>(() => {
    try {
      const saved = localStorage.getItem('wanderlust_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Recent Searches (LocalStorage)
  const [recentSearches, setRecentSearches] = useState<
    { querySummary: string; prefs: SearchPreferences }[]
  >(() => {
    try {
      const saved = localStorage.getItem('wanderlust_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals & Drawers
  const [isFavoritesOpen, setIsFavoritesOpen] = useState<boolean>(false);
  const [isMcpInspectorOpen, setIsMcpInspectorOpen] = useState<boolean>(false);
  const [activeModalDest, setActiveModalDest] = useState<DestinationItem | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync favorites & preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('wanderlust_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('wanderlust_preferences', JSON.stringify(preferences));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [preferences]);

  useEffect(() => {
    try {
      localStorage.setItem('wanderlust_currency', selectedCurrency);
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [selectedCurrency]);

  const recordRecentSearch = (prefs: SearchPreferences) => {
    const daysStr = prefs.customTripDays ? `${prefs.customTripDays}d` : prefs.tripLength;
    const summary = `${prefs.originCity.split('(')[0].trim()} → ${prefs.persona} (${daysStr}, ${prefs.budgetTier})`;
    const updated = [
      { querySummary: summary, prefs },
      ...recentSearches.filter((s) => s.querySummary !== summary),
    ].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem('wanderlust_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  // Live Trip Generation Core Function
  const handleGenerate = async (customPrefs?: SearchPreferences) => {
    const activePrefs = customPrefs || preferences;
    setIsGenerating(true);
    setErrorNotice(null);

    try {
      const response = await fetch('/api/generate-trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activePrefs),
      });

      const responseText = await response.text();
      let data: GenerateTripsResponse;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('Non-JSON response from server:', responseText.slice(0, 300));
        throw new Error(
          response.ok
            ? 'The curation engine returned an unexpected format. Please try again.'
            : `Server response error (${response.status}). Please try again.`
        );
      }

      if (!response.ok) {
        throw new Error((data as any)?.error || `Server responded with ${response.status}`);
      }

      if (data.destinations && data.destinations.length > 0) {
        setDestinations(data.destinations);
        setMcpTrace(data.mcpTrace || []);
        recordRecentSearch(activePrefs);
        setIsFiltersExpanded(false); // Collapse filters so cards take center stage
        addToast(`Curated 3 tailored escapes from ${activePrefs.originCity}!`, 'success');

        // Scroll smoothly to results
        setTimeout(() => {
          document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        throw new Error('No destinations returned from travel engine.');
      }
    } catch (err: any) {
      console.error('Error generating trips:', err);
      setErrorNotice(err.message || 'Failed to curate vacations. Please check network connection.');
      addToast('Error generating vacations. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Surprise Me Action (Wildcard Mode)
  const handleSurpriseMe = () => {
    const personas: SearchPreferences['persona'][] = [
      'adventure',
      'tropical',
      'foodie',
      'culture',
      'romantic',
      'roadtrip',
      'wellness',
      'hiddengem',
    ];
    const tiers: SearchPreferences['budgetTier'][] = ['backpacker', 'balanced', 'luxury', 'ultraluxe'];
    const groups: SearchPreferences['groupDynamic'][] = ['solo', 'couple', 'friends', 'family'];
    const climates: SearchPreferences['climateBias'][] = ['warm', 'mild', 'snowy', 'tropical'];

    const randomPrefs: SearchPreferences = {
      persona: personas[Math.floor(Math.random() * personas.length)],
      budgetTier: tiers[Math.floor(Math.random() * tiers.length)],
      groupDynamic: groups[Math.floor(Math.random() * groups.length)],
      tripLength: 'week',
      travelTiming: 'Flexible / Upcoming season',
      originCity: preferences.originCity || 'New York (JFK)',
      maxFlightDuration: 'any',
      climateBias: climates[Math.floor(Math.random() * climates.length)],
      customNotes: 'Wildcard off-the-beaten-path hidden gems',
      isSurpriseMe: true,
    };

    setPreferences(randomPrefs);
    handleGenerate(randomPrefs);
  };

  // Toggle Favorite
  const handleToggleFavorite = (dest: DestinationItem) => {
    const exists = favorites.some((f) => f.id === dest.id);
    if (exists) {
      setFavorites(favorites.filter((f) => f.id !== dest.id));
      addToast(`Removed "${dest.name}" from saved escapes.`, 'info');
    } else {
      setFavorites([dest, ...favorites]);
      addToast(`Saved "${dest.name}" to your bucket list!`, 'success');
    }
  };

  // Share Destination
  const handleShare = (dest: DestinationItem) => {
    const summary = `${dest.name}, ${dest.country} — "${dest.hook}"\nDaily budget: $${dest.budget.dailyTotalUsd}/day\nFlight from ${preferences.originCity}: ${dest.logistics.flightDurationEstimate}\nCurated by Wanderlust AI`;
    navigator.clipboard.writeText(summary);
    addToast('Trip dossier copied to clipboard!', 'success');
  };

  // Export Markdown
  const handleExportMarkdown = (dest: DestinationItem) => {
    const content = exportDestinationToMarkdown(dest, preferences);
    const filename = `${dest.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-itinerary.md`;
    downloadMarkdownFile(filename, content);
    addToast(`Downloaded ${filename}`, 'success');
  };

  // Trigger initial curated showcase on initial mount if empty
  useEffect(() => {
    if (destinations.length === 0) {
      handleGenerate();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Global Navigation Header */}
      <Header
        favoritesCount={favorites.length}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenMcpInspector={() => setIsMcpInspectorOpen(true)}
        onSurpriseMe={handleSurpriseMe}
        isGenerating={isGenerating}
        selectedCurrency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* Editorial Hero Banner */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/80 border border-amber-200/90 text-amber-900 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>AI Travel Architect • Live Context Protocol</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 leading-[1.15]">
            Where will your next chapter{' '}
            <span className="italic font-normal text-amber-800 underline decoration-amber-400/40 decoration-wavy underline-offset-8">
              unfold?
            </span>
          </h1>

          <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-normal">
            No static brochures or repetitive top-10 lists. Every query triggers a live LLM completion grounded by authentic photography, flight proximity routers, and real-time seasonal advisories via MCP.
          </p>
        </section>

        {/* Filter Section Accordion */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-800" />
              <h2 className="font-serif text-lg font-bold text-stone-900">
                Tailor Your Criteria
              </h2>
              <span className="text-xs text-stone-500 font-mono">
                ({preferences.persona} • {preferences.budgetTier} • {preferences.customTripDays || 7} Days • {preferences.originCity})
              </span>
            </div>

            <button
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:border-amber-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-all cursor-pointer shadow-2xs"
            >
              <span>{isFiltersExpanded ? 'Collapse Filters' : 'Adjust Filters'}</span>
              {isFiltersExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isFiltersExpanded && (
            <FilterPanel
              preferences={preferences}
              onChange={setPreferences}
              onSubmit={() => handleGenerate()}
              onSurpriseMe={handleSurpriseMe}
              isGenerating={isGenerating}
              recentSearches={recentSearches}
              onSelectRecentSearch={(p) => {
                setPreferences(p);
                handleGenerate(p);
              }}
            />
          )}
        </section>

        {/* Loading State or Error or Results */}
        {isGenerating ? (
          <LoadingState />
        ) : errorNotice ? (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-rose-950">
              Curation Engine Notice
            </h3>
            <p className="text-sm text-rose-800 leading-relaxed">
              {errorNotice}
            </p>
            <button
              onClick={() => handleGenerate()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Generation</span>
            </button>
          </div>
        ) : (
          <section id="results-section" className="space-y-6 pt-4">
            {/* Results Title Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200/80">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-700" />
                  <h2 className="font-serif text-2xl font-bold text-stone-900">
                    Curated Destinations
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    3 Custom Escapes
                  </span>
                </div>
                <p className="text-xs text-stone-700 mt-0.5">
                  Departing from <strong className="text-stone-900">{preferences.originCity}</strong> for{' '}
                  <strong className="text-stone-900">{preferences.customTripDays || 7}-day</strong>{' '}
                  <strong className="text-stone-900">{preferences.persona}</strong> journey ({preferences.budgetTier} tier).
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-stone-200 hover:border-amber-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-all cursor-pointer shadow-2xs"
                  title="Generate a fresh new batch of 3 destinations with these filters"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                  <span>Regenerate Ideas</span>
                </button>
              </div>
            </div>

            {/* Destination Cards 3-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {destinations.map((dest) => (
                <DestinationCard
                  key={dest.id}
                  destination={dest}
                  isFavorite={favorites.some((f) => f.id === dest.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onShare={handleShare}
                  onExportMarkdown={handleExportMarkdown}
                  onOpenDetails={setActiveModalDest}
                  selectedCurrency={selectedCurrency}
                  tripDays={preferences.customTripDays || 7}
                />
              ))}
            </div>
          </section>
        )}

        {/* Editorial Value Props Banner */}
        <section className="bg-stone-900 text-stone-100 rounded-3xl p-8 sm:p-12 shadow-xl border border-stone-800 space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
              The Architecture of Wanderlust AI
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
              Model Context Protocol (MCP) in Action
            </h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              Standard LLM prompts often hallucinate non-existent travel connections or offer stale recommendations.
              Wanderlust AI enriches live completions with real-time external tool executions:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-stone-800">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Globe2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Verified Geo Visuals</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Connects each location candidate to high-resolution verified photography and exact GPS coordinates with direct Google Maps linking.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <PlaneTakeoff className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Flight Transit Corridors</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Calculates realistic flight times, primary IATA hub airports, layover vs direct paths, and carbon emission estimates from your chosen city.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Seasonal Grounding</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Pulls seasonal weather metrics, shoulder-season crowd advice, local festival calendars, and visa requirements.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-stone-100/60 py-8 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-700" />
            <span className="font-serif font-bold text-stone-800">Wanderlust AI</span>
            <span>— Open, frictionless travel architecture</span>
          </div>
          <div className="text-stone-700">
            Client state stored in LocalStorage • Powered by Gemini 3.1 Flash & MCP Tools
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <DestinationModal
        destination={activeModalDest}
        onClose={() => setActiveModalDest(null)}
        isFavorite={Boolean(activeModalDest && favorites.some((f) => f.id === activeModalDest.id))}
        onToggleFavorite={handleToggleFavorite}
        onExportMarkdown={handleExportMarkdown}
        onShare={handleShare}
        selectedCurrency={selectedCurrency}
        tripDays={preferences.customTripDays || 7}
      />

      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        onRemoveFavorite={(id) => setFavorites(favorites.filter((f) => f.id !== id))}
        onClearAll={() => setFavorites([])}
        onOpenDetails={(dest) => {
          setIsFavoritesOpen(false);
          setActiveModalDest(dest);
        }}
        selectedCurrency={selectedCurrency}
      />

      <McpInspectorModal
        isOpen={isMcpInspectorOpen}
        onClose={() => setIsMcpInspectorOpen(false)}
        mcpTrace={mcpTrace}
      />

      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
