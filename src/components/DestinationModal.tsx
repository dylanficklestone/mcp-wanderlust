import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  DollarSign,
  Plane,
  ShieldCheck,
  Sparkles,
  Download,
  Share2,
  ExternalLink,
  Sun,
  Leaf,
  Luggage,
  Check,
  Compass,
  Heart,
  Hotel,
  Star,
  Bed,
} from 'lucide-react';
import { DestinationItem, SupportedCurrency } from '../types/travel.ts';
import { formatCurrency } from '../utils/travelUtils.ts';

interface DestinationModalProps {
  destination: DestinationItem | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (dest: DestinationItem) => void;
  onExportMarkdown: (dest: DestinationItem) => void;
  onShare: (dest: DestinationItem) => void;
  selectedCurrency: SupportedCurrency;
  tripDays?: number;
}

export const DestinationModal: React.FC<DestinationModalProps> = ({
  destination,
  onClose,
  isFavorite,
  onToggleFavorite,
  onExportMarkdown,
  onShare,
  selectedCurrency,
  tripDays = 7,
}) => {
  if (!destination) return null;

  const [tripDurationDays, setTripDurationDays] = useState<number>(tripDays || 7);
  const [activePhoto, setActivePhoto] = useState<string>(destination.heroPhoto.url);

  // Sync when tripDays prop changes
  React.useEffect(() => {
    if (tripDays) setTripDurationDays(tripDays);
  }, [tripDays]);

  const totalCalculatedSpend = destination.budget.dailyTotalUsd * tripDurationDays;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-900 leading-tight">
                {destination.name}, {destination.country}
              </h2>
              <p className="text-xs text-stone-600">Tailored Travel Architecture & Dossier</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(destination)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-rose-50 border-rose-300 text-rose-600'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
              title="Save to favorites"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
            </button>
            <button
              onClick={() => onShare(destination)}
              className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Share destination"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onExportMarkdown(destination)}
              className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Export Markdown"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto">
          {/* Main Visual Showcase */}
          <div className="space-y-3">
            <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-stone-900 shadow-sm">
              <img
                src={activePhoto}
                alt={destination.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-xs font-mono uppercase bg-amber-600/90 px-2 py-0.5 rounded text-white font-bold">
                  {destination.region}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold mt-1">
                  {destination.name}
                </h3>
                <p className="text-stone-200 text-sm italic mt-0.5">"{destination.hook}"</p>
              </div>
            </div>

            {/* Gallery Thumbnails */}
            {destination.secondaryPhotos && destination.secondaryPhotos.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setActivePhoto(destination.heroPhoto.url)}
                  className={`h-16 w-24 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    activePhoto === destination.heroPhoto.url ? 'border-amber-600 ring-2 ring-amber-600/30' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={destination.heroPhoto.url} alt="Hero" className="w-full h-full object-cover" />
                </button>
                {destination.secondaryPhotos.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhoto(p.url)}
                    className={`h-16 w-24 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activePhoto === p.url ? 'border-amber-600 ring-2 ring-amber-600/30' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Geo Coordinates & Live Weather Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Geo & Map Card */}
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-700" />
                  <span>Geo-Coordinates (MCP Resolved)</span>
                </span>
                <a
                  href={destination.geoCoordinates.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="font-mono text-xs text-stone-600 bg-white p-3 rounded-xl border border-stone-200 space-y-1">
                <div>Latitude: <strong className="text-stone-900">{destination.geoCoordinates.lat.toFixed(4)}° N</strong></div>
                <div>Longitude: <strong className="text-stone-900">{destination.geoCoordinates.lng.toFixed(4)}° E</strong></div>
                <div>Primary Airport: <strong className="text-stone-900">{destination.logistics.primaryAirportName} ({destination.logistics.primaryAirportCode})</strong></div>
              </div>
            </div>

            {/* Live Weather & Climate */}
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/80 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-700" />
                <span>Weather & Seasonal Climate</span>
              </span>

              <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold font-serif text-stone-900">
                    {destination.weather.avgTempC}°C <span className="text-sm font-sans font-normal text-stone-600">({destination.weather.avgTempF}°F)</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    {destination.weather.condition}
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {destination.weather.seasonNotice}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Trip Budget Calculator */}
          <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-200/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-serif text-lg font-bold text-stone-900">
                  Total Journey Budget Calculator
                </h4>
                <p className="text-xs text-stone-600">
                  Adjust trip duration to estimate total accommodation, food, and local transit.
                </p>
              </div>

              {/* Duration selector tabs */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 shadow-xs">
                {[3, 5, 7, 10, 14].map((days) => (
                  <button
                    key={days}
                    onClick={() => setTripDurationDays(days)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      tripDurationDays === days
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                <span className="text-[11px] text-stone-600">Accommodation ({tripDurationDays}d)</span>
                <div className="text-base font-bold font-mono text-stone-900 mt-0.5">
                  {formatCurrency(destination.budget.dailyStayUsd * tripDurationDays, selectedCurrency)}
                </div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                <span className="text-[11px] text-stone-600">Food & Dining ({tripDurationDays}d)</span>
                <div className="text-base font-bold font-mono text-stone-900 mt-0.5">
                  {formatCurrency(destination.budget.dailyFoodUsd * tripDurationDays, selectedCurrency)}
                </div>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                <span className="text-[11px] text-stone-600">Local Transit ({tripDurationDays}d)</span>
                <div className="text-base font-bold font-mono text-stone-900 mt-0.5">
                  {formatCurrency(destination.budget.dailyTransportUsd * tripDurationDays, selectedCurrency)}
                </div>
              </div>
              <div className="bg-amber-100/70 p-3.5 rounded-xl border border-amber-300">
                <span className="text-[11px] font-bold text-amber-900">Total Projected Spend</span>
                <div className="text-base font-bold font-mono text-amber-950 mt-0.5">
                  {formatCurrency(totalCalculatedSpend, selectedCurrency)}
                </div>
              </div>
            </div>
          </div>

          {/* Full 3-Day Itinerary Detailed Breakdown */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg font-bold text-stone-900">
              Curated 3-Day Deep Itinerary
            </h4>

            <div className="space-y-4">
              {destination.curatedItinerary.map((day) => (
                <div
                  key={day.day}
                  className="bg-stone-50 rounded-2xl p-5 border border-stone-200/80 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-stone-900">
                      Day {day.day}: {day.title}
                    </span>
                    <span className="text-[11px] font-mono uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                      {day.highlightType.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                    <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1">
                      <span className="font-bold text-amber-800 uppercase text-[10px] tracking-wider">Morning</span>
                      <p className="text-stone-700 leading-relaxed">{day.morning}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1">
                      <span className="font-bold text-amber-800 uppercase text-[10px] tracking-wider">Afternoon</span>
                      <p className="text-stone-700 leading-relaxed">{day.afternoon}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1">
                      <span className="font-bold text-amber-800 uppercase text-[10px] tracking-wider">Evening</span>
                      <p className="text-stone-700 leading-relaxed">{day.evening}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Curated Lodging & Hotels Showcase */}
          {destination.hotelRecommendations && destination.hotelRecommendations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Hotel className="w-5 h-5 text-amber-700" />
                    <span>Where to Stay: Curated Lodging & Hotels</span>
                  </h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Hand-picked stays aligned with your budget tier ({destination.budget.tier}) and neighborhood access.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  {destination.hotelRecommendations.length} Curated Stays
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {destination.hotelRecommendations.map((hotel, idx) => (
                  <div
                    key={idx}
                    className="bg-stone-50 rounded-2xl border border-stone-200/90 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    {hotel.photoUrl && (
                      <div className="h-36 w-full relative bg-stone-800 overflow-hidden">
                        <img
                          src={hotel.photoUrl}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-stone-900/80 text-white backdrop-blur-xs">
                          {hotel.tier}
                        </div>
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-stone-950 flex items-center gap-1 shadow-xs">
                          <Star className="w-3 h-3 fill-stone-950" />
                          <span>{hotel.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}

                    <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-bold text-sm text-stone-900 leading-snug">
                            {hotel.name}
                          </h5>
                          <span className="font-mono font-bold text-amber-800 text-sm shrink-0">
                            {formatCurrency(hotel.pricePerNightUsd, selectedCurrency)}
                            <span className="text-[10px] font-sans font-normal text-stone-600">/nt</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-stone-600 mt-1">
                          <MapPin className="w-3 h-3 text-amber-700 shrink-0" />
                          <span>{hotel.neighborhood}</span>
                        </div>

                        <p className="text-xs text-stone-700 italic mt-2 leading-relaxed">
                          "{hotel.vibe}"
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-stone-200/60">
                        <div className="flex flex-wrap gap-1">
                          {hotel.amenities.map((amenity, aIdx) => (
                            <span
                              key={aIdx}
                              className="text-[10px] bg-white border border-stone-200 text-stone-700 px-2 py-0.5 rounded-md"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>

                        <p className="text-[11px] text-stone-600">
                          <strong className="text-stone-800">Booking Advice:</strong> {hotel.bookingNote}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Seasonal Highlights & Festival Note */}
          {destination.localFestivalOrEvent && (
            <div className="bg-stone-900 text-white rounded-2xl p-5 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                Seasonal Calendar & Pulse
              </span>
              <h5 className="font-serif text-base font-bold text-white">
                {destination.localFestivalOrEvent}
              </h5>
              <div className="space-y-1 text-xs text-stone-300 pt-1">
                {destination.liveContextHighlights?.map((h, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400">•</span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Packing & Etiquette Advice */}
          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/80 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Luggage className="w-4 h-4 text-amber-700" />
              <span>Traveler Packing & Etiquette Notes</span>
            </span>
            <p className="text-xs text-stone-700 leading-relaxed">
              <strong>Insider Pro-Tip:</strong> {destination.proTip}
            </p>
            <p className="text-xs text-stone-700 leading-relaxed">
              <strong>Entry Formalities:</strong> {destination.logistics.visaSnapshot}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-stone-50 px-6 py-4 border-t border-stone-200 flex items-center justify-between gap-3">
          <div className="text-xs text-stone-600">
            Destination ID: <code className="font-mono">{destination.id}</code>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExportMarkdown(destination)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 hover:bg-white text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Dossier (MD)</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
