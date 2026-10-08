import React, { useState } from 'react';
import {
  Heart,
  Share2,
  Download,
  Plane,
  DollarSign,
  Compass,
  Calendar,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Leaf,
  Sun,
  Eye,
  Camera,
  Hotel,
  Star,
  Bed,
} from 'lucide-react';
import { DestinationItem, SupportedCurrency } from '../types/travel.ts';
import { formatCurrency } from '../utils/travelUtils.ts';

interface DestinationCardProps {
  destination: DestinationItem;
  isFavorite: boolean;
  onToggleFavorite: (dest: DestinationItem) => void;
  onShare: (dest: DestinationItem) => void;
  onExportMarkdown: (dest: DestinationItem) => void;
  onOpenDetails: (dest: DestinationItem) => void;
  selectedCurrency: SupportedCurrency;
  tripDays?: number;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({
  destination,
  isFavorite,
  onToggleFavorite,
  onShare,
  onExportMarkdown,
  onOpenDetails,
  selectedCurrency,
  tripDays = 7,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [imageError, setImageError] = useState(false);
  const [showAllRationale, setShowAllRationale] = useState(false);

  const fallbackImageUrl =
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';

  const heroPhotoUrl = imageError ? fallbackImageUrl : destination.heroPhoto.url;
  const activeDayPlan = destination.curatedItinerary.find((d) => d.day === selectedDay) || destination.curatedItinerary[0];

  return (
    <article className="group bg-white rounded-3xl border border-stone-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
      {/* Top Hero Visual */}
      <div className="relative h-64 sm:h-72 overflow-hidden bg-stone-900">
        <img
          src={heroPhotoUrl}
          alt={`${destination.name}, ${destination.country}`}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.9]"
          loading="lazy"
        />

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>

        {/* Top Floating Controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
          {/* Region Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-stone-800 text-xs font-bold tracking-tight shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-amber-700" />
            <span>{destination.country}</span>
            <span className="text-stone-700">•</span>
            <span className="text-stone-700 font-medium">{destination.region}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleFavorite(destination)}
              className={`p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-sm ${
                isFavorite
                  ? 'bg-rose-500 text-white'
                  : 'bg-stone-900/60 hover:bg-stone-900/80 text-white hover:text-rose-300'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bottom Hero Overlay: Destination Title & Hook */}
        <div className="absolute bottom-4 left-4 right-4 text-white z-10 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-600/90 text-white backdrop-blur-xs">
              {destination.budget.tier} Tier
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/20 text-white backdrop-blur-xs flex items-center gap-1">
              <Plane className="w-3 h-3" />
              <span>{destination.logistics.flightDurationEstimate}</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-600/80 text-white backdrop-blur-xs flex items-center gap-1">
              <Sun className="w-3 h-3" />
              <span>{destination.weather.avgTempC}°C</span>
            </span>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight drop-shadow-sm">
            {destination.name}
          </h3>

          <p className="text-stone-200 text-xs sm:text-sm font-medium line-clamp-2 drop-shadow-xs italic">
            "{destination.hook}"
          </p>
        </div>

        {/* Photographer credit badge */}
        <div className="absolute bottom-1 right-2 z-10 text-[9px] text-stone-400 font-mono flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
          <Camera className="w-2.5 h-2.5" />
          <span>{destination.heroPhoto.photographer}</span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
        {/* Section 1: Relevance Rationale */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Why This Matches You</span>
            </span>
            {destination.relevanceRationale.length > 2 && (
              <button
                onClick={() => setShowAllRationale(!showAllRationale)}
                className="text-[11px] font-medium text-stone-700 hover:text-stone-900 cursor-pointer"
              >
                {showAllRationale ? 'Show less' : 'View all'}
              </button>
            )}
          </div>

          <div className="bg-amber-50/60 rounded-2xl p-3.5 border border-amber-200/60 space-y-1.5 text-xs text-stone-800">
            {(showAllRationale
              ? destination.relevanceRationale
              : destination.relevanceRationale.slice(0, 2)
            ).map((point, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-amber-700 font-bold leading-relaxed shrink-0">•</span>
                <span className="leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Cost & Logistics Matrix */}
        <div className="space-y-3 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-stone-600" />
            <span>Budget & Logistics Matrix</span>
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Daily Budget Breakdown */}
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/70 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                <span>Daily Estimate</span>
                <span className="text-amber-800 font-mono text-sm">
                  {formatCurrency(destination.budget.dailyTotalUsd, selectedCurrency)}
                </span>
              </div>
              <div className="text-[11px] text-stone-700 space-y-0.5 pt-1 border-t border-stone-200/50">
                <div className="flex justify-between">
                  <span>Stay:</span>
                  <span className="font-medium text-stone-800">{formatCurrency(destination.budget.dailyStayUsd, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Food:</span>
                  <span className="font-medium text-stone-800">{formatCurrency(destination.budget.dailyFoodUsd, selectedCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transit:</span>
                  <span className="font-medium text-stone-800">{formatCurrency(destination.budget.dailyTransportUsd, selectedCurrency)}</span>
                </div>
              </div>
              <div className="mt-1 pt-1 border-t border-amber-200/60 flex items-center justify-between text-[10px] font-semibold text-amber-900 bg-amber-100/50 px-1.5 py-0.5 rounded">
                <span>{tripDays}d Trip Total:</span>
                <span className="font-mono font-bold">
                  {formatCurrency(destination.budget.dailyTotalUsd * tripDays, selectedCurrency)}
                </span>
              </div>
            </div>

            {/* Flight & Transit Info */}
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/70 space-y-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                  <span>Airport Hub</span>
                  <span className="font-mono bg-stone-200/80 px-1.5 py-0.5 rounded text-[11px] text-stone-800">
                    {destination.logistics.primaryAirportCode}
                  </span>
                </div>
                <div className="text-[11px] text-stone-700 mt-1 line-clamp-1">
                  {destination.logistics.primaryAirportName}
                </div>
              </div>

              <div className="text-[11px] pt-1 border-t border-stone-200/50 flex items-center justify-between">
                <span className="text-stone-700">Routing:</span>
                <span
                  className={`font-semibold ${
                    destination.logistics.directFlightAvailable ? 'text-emerald-700' : 'text-stone-800'
                  }`}
                >
                  {destination.logistics.directFlightAvailable ? 'Direct Available' : '1 Stop Route'}
                </span>
              </div>
            </div>
          </div>

          {/* Visa & Best Neighborhood Snapshot */}
          <div className="p-3 bg-stone-50/70 rounded-2xl border border-stone-200/60 text-[11px] space-y-1">
            <div className="flex items-start gap-1.5 text-stone-700">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-stone-800">Entry/Visa:</strong> {destination.logistics.visaSnapshot}
              </span>
            </div>
            <div className="flex items-start gap-1.5 text-stone-700">
              <MapPin className="w-3.5 h-3.5 text-stone-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-stone-800">Recommended Quarter:</strong> {destination.logistics.bestNeighborhood}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Curated 3-Day Highlight Itinerary */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-600" />
              <span>Curated 3-Day Highlights</span>
            </span>

            {/* Day Selector Buttons */}
            <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedDay === d
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-800'
                  }`}
                >
                  Day {d}
                </button>
              ))}
            </div>
          </div>

          {/* Active Day Card */}
          {activeDayPlan && (
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2.5 text-xs">
              <div className="font-semibold text-stone-900 text-xs sm:text-sm flex items-center justify-between">
                <span>{activeDayPlan.title}</span>
                <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  {activeDayPlan.highlightType === 'arrival_landmark'
                    ? 'Arrival & Landmark'
                    : activeDayPlan.highlightType === 'culture_adventure'
                    ? 'Culture & Adventure'
                    : 'Food & Hidden Gem'}
                </span>
              </div>

              <div className="space-y-1.5 text-stone-700">
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-800 shrink-0 text-[11px]">Morning:</span>
                  <span className="leading-relaxed">{activeDayPlan.morning}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-800 shrink-0 text-[11px]">Afternoon:</span>
                  <span className="leading-relaxed">{activeDayPlan.afternoon}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="font-bold text-amber-800 shrink-0 text-[11px]">Evening:</span>
                  <span className="leading-relaxed">{activeDayPlan.evening}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Hotel & Stay Recommendations */}
        {destination.hotelRecommendations && destination.hotelRecommendations.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Hotel className="w-3.5 h-3.5 text-stone-600" />
                <span>Curated Stays & Hotels</span>
              </span>
              <span className="text-[11px] font-mono text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded font-semibold">
                {destination.hotelRecommendations.length} Options
              </span>
            </div>

            <div className="space-y-2">
              {destination.hotelRecommendations.map((hotel, hIdx) => (
                <div
                  key={hIdx}
                  className="bg-stone-50 rounded-2xl p-3 border border-stone-200/80 space-y-1.5 text-xs hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-900 text-xs sm:text-sm">{hotel.name}</span>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                          {hotel.tier}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-600 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>{hotel.neighborhood}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-amber-800 text-xs sm:text-sm">
                        {formatCurrency(hotel.pricePerNightUsd, selectedCurrency)}
                        <span className="text-[10px] font-sans font-normal text-stone-600">/nt</span>
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-amber-700">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{hotel.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-700 leading-relaxed italic">
                    "{hotel.vibe}"
                  </p>

                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {hotel.amenities.slice(0, 3).map((amenity, aIdx) => (
                      <span
                        key={aIdx}
                        className="text-[10px] bg-white border border-stone-200/90 text-stone-700 px-1.5 py-0.5 rounded-md"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Insider Pro-Tip */}
        <div className="bg-gradient-to-r from-amber-100/70 to-orange-50/70 rounded-2xl p-3.5 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5">
          <span className="font-bold uppercase text-[10px] tracking-wider text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
            Pro-Tip
          </span>
          <p className="leading-relaxed italic">{destination.proTip}</p>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 bg-stone-50/80 border-t border-stone-200/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onShare(destination)}
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 transition-colors cursor-pointer"
            title="Share trip summary"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onExportMarkdown(destination)}
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 transition-colors cursor-pointer"
            title="Export itinerary to Markdown"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => onOpenDetails(destination)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
        >
          <span>Deep Dive Details</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
};
