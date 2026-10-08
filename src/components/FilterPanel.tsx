import React, { useState } from 'react';
import {
  Compass,
  DollarSign,
  Users,
  Calendar,
  Plane,
  Sparkles,
  Sun,
  Flame,
  Palmtree,
  UtensilsCrossed,
  Landmark,
  Heart,
  Car,
  Flower2,
  Clock,
  CloudSun,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  History,
  Minus,
  Plus,
  Sliders,
} from 'lucide-react';
import {
  BudgetTier,
  ClimateBias,
  FlightDurationLimit,
  GroupDynamic,
  SearchPreferences,
  TravelPersona,
  TripLength,
} from '../types/travel.ts';

interface FilterPanelProps {
  preferences: SearchPreferences;
  onChange: (prefs: SearchPreferences) => void;
  onSubmit: () => void;
  onSurpriseMe: () => void;
  isGenerating: boolean;
  recentSearches: { querySummary: string; prefs: SearchPreferences }[];
  onSelectRecentSearch: (prefs: SearchPreferences) => void;
}

const PERSONAS: { id: TravelPersona; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'adventure', label: 'Adventure & Trekking', desc: 'Alpine peaks, wild trails & adrenaline', icon: Flame },
  { id: 'tropical', label: 'Tropical Chill', desc: 'Turquoise waters, pristine sands & island breeze', icon: Palmtree },
  { id: 'foodie', label: 'Foodie & Nightlife', desc: 'Legendary street stalls, wine bars & night markets', icon: UtensilsCrossed },
  { id: 'culture', label: 'Deep Cultural Heritage', desc: 'Centuries-old temples, palaces & artisan craft', icon: Landmark },
  { id: 'romantic', label: 'Romantic Escape', desc: 'Intimate cliffside retreats & candlelit dining', icon: Heart },
  { id: 'roadtrip', label: 'Scenic Road Trips', desc: 'Coastal byways, mountain passes & freedom', icon: Car },
  { id: 'wellness', label: 'Wellness & Eco-Retreat', desc: 'Thermal hot springs, forest baths & organic stays', icon: Flower2 },
  { id: 'hiddengem', label: 'Hidden Off-Beat Gems', desc: 'Secret villages away from commercial tourist tracks', icon: Compass },
];

const BUDGET_TIERS: { id: BudgetTier; symbol: string; label: string; range: string; note: string }[] = [
  { id: 'backpacker', symbol: '$', label: 'Backpacker', range: '<$60 / day', note: 'Hostels, local transit & street food treasures' },
  { id: 'balanced', symbol: '$$', label: 'Balanced', range: '$60 - $180 / day', note: 'Boutique guest houses, mix of cozy bistros & activities' },
  { id: 'luxury', symbol: '$$$', label: 'Luxury', range: '$180 - $350 / day', note: 'Charming 4-star hotels, private excursions & tasting menus' },
  { id: 'ultraluxe', symbol: '$$$$', label: 'Ultra-Luxe', range: '$350+ / day', note: 'Palatial 5-star villas, bespoke transfers & Michelin dining' },
];

const GROUP_DYNAMICS: { id: GroupDynamic; label: string; desc: string }[] = [
  { id: 'solo', label: 'Solo Traveler', desc: 'Self-discovery, easy social spots & flexible pacing' },
  { id: 'couple', label: 'Couple', desc: 'Intimate moments, scenic vistas & shared romance' },
  { id: 'friends', label: 'Group of Friends', desc: 'Shared adventures, lively evenings & group feasts' },
  { id: 'family', label: 'Family with Kids', desc: 'Wholesome activities, safe walkable areas & comfort' },
];

const TRIP_LENGTHS: { id: TripLength; label: string; span: string; defaultDays: number }[] = [
  { id: 'weekend', label: 'Weekend Break', span: '2 - 4 Days', defaultDays: 3 },
  { id: 'week', label: 'Week-Long Journey', span: '7 - 9 Days', defaultDays: 7 },
  { id: 'extended', label: 'Extended Voyage', span: '14+ Days', defaultDays: 14 },
  { id: 'custom', label: 'Custom Duration', span: 'Exact Days', defaultDays: 5 },
];

const CLIMATES: { id: ClimateBias; label: string; desc: string }[] = [
  { id: 'warm', label: 'Warm & Sunny', desc: 'Pleasant golden sunshine & blue skies' },
  { id: 'mild', label: 'Mild & Temperate', desc: 'Comfortable walking weather (16-22°C)' },
  { id: 'snowy', label: 'Crisp & Snowy', desc: 'Winter wonderland & mountain chalets' },
  { id: 'tropical', label: 'Lush & Tropical', desc: 'Warm tropical rain, jungle greenery & sea breezes' },
];

const POPULAR_ORIGINS = [
  'New York (JFK)',
  'London (LHR)',
  'San Francisco (SFO)',
  'Los Angeles (LAX)',
  'Chicago (ORD)',
  'Tokyo (HND)',
  'Paris (CDG)',
  'Sydney (SYD)',
];

const SEASONS_LIST = [
  'Spring (Mar - May)',
  'Summer (Jun - Aug)',
  'Autumn (Sep - Nov)',
  'Winter (Dec - Feb)',
  'Flexible / Any Time',
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  preferences,
  onChange,
  onSubmit,
  onSurpriseMe,
  isGenerating,
  recentSearches,
  onSelectRecentSearch,
}) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [showCustomOrigin, setShowCustomOrigin] = useState(false);

  const update = <K extends keyof SearchPreferences>(key: K, value: SearchPreferences[K]) => {
    onChange({ ...preferences, [key]: value });
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl shadow-stone-900/5 overflow-hidden transition-all">
      {/* Header Bar with Step Navigation */}
      <div className="bg-gradient-to-r from-stone-50 via-amber-50/30 to-stone-50 px-6 py-4 border-b border-stone-200/70 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-1.5">
            {[1, 2, 3, 4].map((step) => (
              <button
                key={step}
                onClick={() => setActiveStep(step as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeStep === step
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
                }`}
              >
                <span>Step {step}</span>
                <span className="hidden sm:inline font-normal opacity-85">
                  {step === 1 && '• Vibe'}
                  {step === 2 && '• Budget & Group'}
                  {step === 3 && '• Duration & Climate'}
                  {step === 4 && '• Origin & Flight'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Reset / Randomize Quick Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSurpriseMe}
            disabled={isGenerating}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/70 rounded-lg border border-amber-200/80 transition-colors cursor-pointer"
            title="Surprise me with 3 wild offbeat vacation ideas"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Wildcard Idea</span>
          </button>
        </div>
      </div>

      {/* Main Filter Content */}
      <div className="p-6 sm:p-8">
        {/* STEP 1: Travel Persona / Vibe */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif text-xl font-bold text-stone-900">What is the vibe of your ideal getaway?</h3>
              </div>
              <p className="text-sm text-stone-700">
                Choose the primary atmosphere and emotional resonance you want for this journey.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {PERSONAS.map((item) => {
                const Icon = item.icon;
                const isSelected = preferences.persona === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => update('persona', item.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-36 ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20 shadow-sm'
                        : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50/70 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-stone-900 leading-snug">{item.label}</h4>
                      <p className="text-xs text-stone-700 mt-1 line-clamp-2">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Budget Tier & Group Dynamics */}
        {activeStep === 2 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Budget */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif text-xl font-bold text-stone-900">Select your daily budget tier</h3>
              </div>
              <p className="text-sm text-stone-700 mb-4">
                Covers accommodation, food & dining, and local experiences per traveler.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {BUDGET_TIERS.map((tier) => {
                  const isSelected = preferences.budgetTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => update('budgetTier', tier.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-34 ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20 shadow-sm'
                          : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50/70 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-base font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                          {tier.symbol}
                        </span>
                        <span className="text-xs font-semibold text-stone-800">{tier.range}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-stone-900">{tier.label}</h4>
                        <p className="text-xs text-stone-700 mt-0.5">{tier.note}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group Dynamic */}
            <div className="pt-4 border-t border-stone-100">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif text-xl font-bold text-stone-900">Who is traveling?</h3>
              </div>
              <p className="text-sm text-stone-700 mb-4">
                Helps the LLM tailor activities, accommodation styles, and dining setups.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {GROUP_DYNAMICS.map((item) => {
                  const isSelected = preferences.groupDynamic === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => update('groupDynamic', item.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20 shadow-sm'
                          : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50/70 bg-white'
                      }`}
                    >
                      <h4 className="font-semibold text-sm text-stone-900">{item.label}</h4>
                      <p className="text-xs text-stone-700 mt-1">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Trip Length, Timing & Climate Bias */}
        {activeStep === 3 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Trip Length */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif text-xl font-bold text-stone-900">Trip Length</h3>
              </div>
              <p className="text-sm text-stone-700 mb-4">
                How many days do you plan to be away?
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {TRIP_LENGTHS.map((item) => {
                  const isSelected = preferences.tripLength === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onChange({
                          ...preferences,
                          tripLength: item.id,
                          customTripDays: item.id === 'custom' ? (preferences.customTripDays || 5) : item.defaultDays,
                        });
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20 shadow-sm'
                          : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50/70 bg-white'
                      }`}
                    >
                      <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                        {item.id === 'custom' && preferences.customTripDays
                          ? `${preferences.customTripDays} Days`
                          : item.span}
                      </span>
                      <h4 className="font-semibold text-sm text-stone-900 mt-1">{item.label}</h4>
                    </button>
                  );
                })}
              </div>

              {/* Exact Days Customization Slider & Stepper */}
              <div className="mt-4 p-5 bg-stone-50/90 rounded-2xl border border-stone-200/90 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-700" />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                        Customize Exact Trip Duration
                      </span>
                      <p className="text-xs text-stone-600">
                        Adjust to your precise itinerary length from 1 to 30 days
                      </p>
                    </div>
                  </div>

                  {/* Number Stepper Control */}
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-xs self-start sm:self-auto">
                    <button
                      onClick={() => {
                        const current = preferences.customTripDays || 7;
                        if (current > 1) {
                          onChange({
                            ...preferences,
                            tripLength: 'custom',
                            customTripDays: current - 1,
                          });
                        }
                      }}
                      className="p-1 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Decrease by 1 day"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="font-mono text-base font-bold text-amber-900 px-2 min-w-16 text-center">
                      {preferences.customTripDays || 7} Days
                    </span>

                    <button
                      onClick={() => {
                        const current = preferences.customTripDays || 7;
                        if (current < 60) {
                          onChange({
                            ...preferences,
                            tripLength: 'custom',
                            customTripDays: current + 1,
                          });
                        }
                      }}
                      className="p-1 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Increase by 1 day"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Range Slider */}
                <div className="space-y-1.5 pt-1">
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={preferences.customTripDays || 7}
                    onChange={(e) => {
                      const days = parseInt(e.target.value, 10);
                      onChange({
                        ...preferences,
                        tripLength: 'custom',
                        customTripDays: days,
                      });
                    }}
                    className="w-full accent-amber-700 cursor-pointer h-2 bg-stone-200 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-stone-500">
                    <span>1 Day (Micro)</span>
                    <span>7 Days (1 Wk)</span>
                    <span>14 Days (2 Wks)</span>
                    <span>21 Days (3 Wks)</span>
                    <span>30 Days (Month)</span>
                  </div>
                </div>

                {/* Quick Days Selector Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-stone-600 mr-1">Quick Select:</span>
                  {[2, 3, 4, 5, 7, 10, 14, 21, 30].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        onChange({
                          ...preferences,
                          tripLength: 'custom',
                          customTripDays: d,
                        });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                        (preferences.customTripDays || 7) === d
                          ? 'bg-amber-700 text-white shadow-xs font-bold'
                          : 'bg-white border border-stone-200 text-stone-700 hover:border-amber-300 hover:bg-amber-50/50'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>

                {/* Pace Explanation Note */}
                <div className="text-xs text-amber-950 bg-amber-100/60 p-2.5 rounded-xl border border-amber-200/60">
                  <strong>Pacing Guide:</strong>{' '}
                  {(preferences.customTripDays || 7) <= 3
                    ? 'Fast-paced getaway focused on iconic landmarks and high-impact neighborhood highlights.'
                    : (preferences.customTripDays || 7) <= 6
                    ? 'Sweet-spot short break: deep dive into 2 key quarters without feeling rushed.'
                    : (preferences.customTripDays || 7) <= 9
                    ? 'Classic week-long balance: allows iconic sights, scenic day trips, and leisurely evenings.'
                    : (preferences.customTripDays || 7) <= 14
                    ? 'Immersive 2-week voyage: venture into regional countryside, artisan villages, and relaxed downtime.'
                    : 'Grand expedition: slow travel, deeper cultural connections, and multi-region exploration.'}
                </div>
              </div>
            </div>

            {/* Travel Season / Timing */}
            <div className="pt-4 border-t border-stone-100">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif text-xl font-bold text-stone-900">When do you want to travel?</h3>
              </div>
              <p className="text-sm text-stone-700 mb-3">
                Used by the MCP Live Travel Context tool to check festivals, crowds, and weather.
              </p>

              <div className="flex flex-wrap gap-2">
                {SEASONS_LIST.map((season) => (
                  <button
                    key={season}
                    onClick={() => update('travelTiming', season)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      preferences.travelTiming === season
                        ? 'border-amber-600 bg-amber-700 text-white shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    {season}
                  </button>
                ))}
              </div>
            </div>

            {/* Climate Bias */}
            <div className="pt-4 border-t border-stone-100">
              <div className="flex items-center gap-2 mb-1">
                <Sun className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif text-xl font-bold text-stone-900">Climate Bias</h3>
              </div>
              <p className="text-sm text-stone-700 mb-4">
                What temperature and weather feel best for you right now?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {CLIMATES.map((item) => {
                  const isSelected = preferences.climateBias === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => update('climateBias', item.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20 shadow-sm'
                          : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50/70 bg-white'
                      }`}
                    >
                      <h4 className="font-semibold text-sm text-stone-900">{item.label}</h4>
                      <p className="text-xs text-stone-700 mt-1">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Geographic Origin & Flight Constraints */}
        {activeStep === 4 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Origin City */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Plane className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif text-xl font-bold text-stone-900">Departure City or Hub</h3>
              </div>
              <p className="text-sm text-stone-700 mb-3">
                Used by the MCP Flight Proximity tool to calculate transit times, flight paths, and hubs.
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                {POPULAR_ORIGINS.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      update('originCity', city);
                      setShowCustomOrigin(false);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      preferences.originCity === city && !showCustomOrigin
                        ? 'border-amber-600 bg-amber-700 text-white shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    {city}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustomOrigin(true)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    showCustomOrigin
                      ? 'border-amber-600 bg-amber-700 text-white shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  + Custom Origin
                </button>
              </div>

              {showCustomOrigin && (
                <div className="max-w-md">
                  <input
                    type="text"
                    value={preferences.originCity}
                    onChange={(e) => update('originCity', e.target.value)}
                    placeholder="Enter city or airport (e.g. Seattle, Berlin BER, Toronto YYZ)"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium text-stone-800 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Flight Duration Limit */}
            <div className="pt-4 border-t border-stone-100">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-amber-700" />
                <h3 className="font-serif text-xl font-bold text-stone-900">Maximum Flight Duration</h3>
              </div>
              <p className="text-sm text-stone-700 mb-4">
                Filter destinations by allowable flight transit hours from {preferences.originCity}.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'under4' as FlightDurationLimit, label: 'Under 4 hours', sub: 'Short haul & regional' },
                  { id: 'under8' as FlightDurationLimit, label: '4 - 8 hours', sub: 'Medium haul' },
                  { id: 'under12' as FlightDurationLimit, label: '8 - 12 hours', sub: 'Long haul' },
                  { id: 'any' as FlightDurationLimit, label: 'Any duration', sub: 'Global exploration' },
                ].map((item) => {
                  const isSelected = preferences.maxFlightDuration === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => update('maxFlightDuration', item.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20 shadow-sm'
                          : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50/70 bg-white'
                      }`}
                    >
                      <h4 className="font-semibold text-xs sm:text-sm text-stone-900">{item.label}</h4>
                      <p className="text-[11px] text-stone-700 mt-0.5">{item.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Traveler Notes / Specific Intentions */}
            <div className="pt-4 border-t border-stone-100">
              <label className="block text-sm font-bold text-stone-900 mb-1">
                Special Traveler Wishes or Constraints (Optional)
              </label>
              <p className="text-xs text-stone-700 mb-2">
                Add any specific wishes: "We love natural wine and quiet coastal hikes", "Must have easy trains", etc.
              </p>
              <textarea
                value={preferences.customNotes || ''}
                onChange={(e) => update('customNotes', e.target.value)}
                placeholder="e.g. Vegetarian-friendly spots, easy public transit, avoiding tourist traps, scenic architecture..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-stone-800 bg-white resize-none"
              />
            </div>
          </div>
        )}

        {/* Bottom Navigation & Generate Trigger */}
        <div className="mt-8 pt-6 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Step Back / Forward */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeStep > 1 && (
              <button
                onClick={() => setActiveStep((prev) => (prev - 1) as any)}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
            {activeStep < 4 ? (
              <button
                onClick={() => setActiveStep((prev) => (prev + 1) as any)}
                className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs ml-auto sm:ml-0"
              >
                <span>Continue to Step {activeStep + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* Primary Submit Action */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onSubmit}
              disabled={isGenerating}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 hover:from-amber-800 hover:to-orange-700 text-white font-semibold text-sm sm:text-base shadow-md shadow-amber-900/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 text-amber-200" />
              <span>{isGenerating ? 'Generating Itineraries...' : 'Generate Tailored Vacations'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Searches Pill Row */}
      {recentSearches.length > 0 && (
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200/60 flex items-center gap-2 overflow-x-auto text-xs text-stone-600">
          <History className="w-3.5 h-3.5 text-stone-600 shrink-0" />
          <span className="font-semibold text-stone-700 shrink-0">Recent:</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {recentSearches.slice(0, 5).map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectRecentSearch(item.prefs)}
                className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-amber-300 hover:text-amber-800 text-[11px] font-medium shrink-0 cursor-pointer transition-colors"
              >
                {item.querySummary}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
