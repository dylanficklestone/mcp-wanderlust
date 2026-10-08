import React from 'react';
import { X, Heart, Trash2, Download, ExternalLink, MapPin, Sparkles } from 'lucide-react';
import { DestinationItem, SupportedCurrency } from '../types/travel.ts';
import { formatCurrency, downloadMarkdownFile } from '../utils/travelUtils.ts';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: DestinationItem[];
  onRemoveFavorite: (id: string) => void;
  onClearAll: () => void;
  onOpenDetails: (dest: DestinationItem) => void;
  selectedCurrency: SupportedCurrency;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favorites,
  onRemoveFavorite,
  onClearAll,
  onOpenDetails,
  selectedCurrency,
}) => {
  if (!isOpen) return null;

  const handleExportAll = () => {
    if (favorites.length === 0) return;
    const combinedContent = `# Wanderlust AI — Saved Escapes & Curated Bucket List
Generated on ${new Date().toLocaleDateString('en-US')}

${favorites
  .map(
    (dest, idx) => `
## ${idx + 1}. ${dest.name}, ${dest.country} (${dest.region})
> "${dest.hook}"

- **Airport & Flight:** ${dest.logistics.primaryAirportName} (${dest.logistics.primaryAirportCode}) — ${dest.logistics.flightDurationEstimate}
- **Daily Budget:** $${dest.budget.dailyTotalUsd}/day
- **Pro-Tip:** ${dest.proTip}
- **Map:** ${dest.geoCoordinates.mapsUrl}
`
  )
  .join('\n---\n')}
`;
    downloadMarkdownFile('wanderlust-saved-destinations.md', combinedContent);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Saved Escapes ({favorites.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {favorites.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">
                <Heart className="w-7 h-7" />
              </div>
              <h4 className="font-serif text-base font-bold text-stone-800">No saved destinations yet</h4>
              <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                Click the heart icon on any generated destination card to pin your favorite vacation ideas into LocalStorage.
              </p>
            </div>
          ) : (
            favorites.map((dest) => (
              <div
                key={dest.id}
                className="group bg-stone-50 hover:bg-amber-50/40 border border-stone-200/80 rounded-2xl p-3.5 flex gap-3.5 transition-all shadow-xs"
              >
                {/* Photo Thumbnail */}
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-stone-200">
                  <img
                    src={dest.heroPhoto.url}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <h5 className="font-semibold text-sm text-stone-900 truncate">
                        {dest.name}
                      </h5>
                      <button
                        onClick={() => onRemoveFavorite(dest.id)}
                        className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-stone-500">
                      <MapPin className="w-3 h-3 text-amber-700" />
                      <span>{dest.country}</span>
                      <span>•</span>
                      <span className="font-mono text-amber-800 font-semibold">
                        {formatCurrency(dest.budget.dailyTotalUsd, selectedCurrency)}/d
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-stone-500 font-mono">
                      {dest.logistics.primaryAirportCode} • {dest.logistics.flightDurationEstimate}
                    </span>
                    <button
                      onClick={() => onOpenDetails(dest)}
                      className="text-xs font-semibold text-amber-800 hover:text-amber-900 inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {favorites.length > 0 && (
          <div className="p-4 bg-stone-50/90 border-t border-stone-200 flex items-center justify-between gap-3">
            <button
              onClick={onClearAll}
              className="text-xs text-stone-500 hover:text-rose-600 transition-colors font-medium cursor-pointer"
            >
              Clear All
            </button>
            <button
              onClick={handleExportAll}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All (MD)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
