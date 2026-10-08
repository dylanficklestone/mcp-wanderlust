export type TravelPersona =
  | 'adventure'
  | 'tropical'
  | 'foodie'
  | 'culture'
  | 'romantic'
  | 'roadtrip'
  | 'wellness'
  | 'hiddengem';

export type BudgetTier = 'backpacker' | 'balanced' | 'luxury' | 'ultraluxe';

export type GroupDynamic = 'solo' | 'couple' | 'friends' | 'family';

export type TripLength = 'weekend' | 'week' | 'extended' | 'custom';

export type ClimateBias = 'warm' | 'mild' | 'snowy' | 'tropical';

export type FlightDurationLimit = 'under4' | 'under8' | 'under12' | 'any';

export interface SearchPreferences {
  persona: TravelPersona;
  budgetTier: BudgetTier;
  groupDynamic: GroupDynamic;
  tripLength: TripLength;
  customTripDays?: number; // Exact customized trip duration in days (e.g. 5, 10, 14, 21)
  travelTiming: string; // e.g. "May - Spring" or "October"
  originCity: string;   // e.g. "New York (JFK)" or "London (LHR)"
  maxFlightDuration: FlightDurationLimit;
  climateBias: ClimateBias;
  customNotes?: string;
  isSurpriseMe?: boolean;
}

export interface DayItinerary {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  highlightType: 'arrival_landmark' | 'culture_adventure' | 'food_hidden_gem';
}

export interface BudgetBreakdown {
  tier: string;
  dailyStayUsd: number;
  dailyFoodUsd: number;
  dailyTransportUsd: number;
  dailyTotalUsd: number;
  localCurrencyCode: string;
  localCurrencySymbol: string;
}

export interface LogisticsInfo {
  primaryAirportCode: string;
  primaryAirportName: string;
  flightDurationEstimate: string;
  directFlightAvailable: boolean;
  transitHubs?: string;
  estimatedDistanceKm?: number;
  visaSnapshot: string;
  bestNeighborhood: string;
  carbonFootprintKg?: number;
}

export interface DestinationPhoto {
  url: string;
  photographer: string;
  photographerUrl?: string;
  caption: string;
  source: 'Unsplash MCP' | 'Pexels MCP' | 'GeoVisuals MCP';
}

export interface WeatherContext {
  avgTempC: number;
  avgTempF: number;
  condition: string;
  seasonNotice: string;
  icon: string;
}

export interface HotelRecommendation {
  id?: string;
  name: string;
  tier: 'Boutique' | 'Luxury' | 'Eco-Lodge' | 'Budget / Hostel' | 'Historic Heritage';
  pricePerNightUsd: number;
  neighborhood: string;
  vibe: string;
  amenities: string[];
  bookingNote: string;
  rating: number; // e.g. 4.8
  photoUrl?: string;
}

export interface DestinationItem {
  id: string;
  name: string;
  country: string;
  region: string;
  hook: string;
  heroPhoto: DestinationPhoto;
  secondaryPhotos?: DestinationPhoto[];
  relevanceRationale: string[];
  vibeTags: string[];
  climateMatch: string;
  geoCoordinates: {
    lat: number;
    lng: number;
    mapsUrl: string;
  };
  weather: WeatherContext;
  budget: BudgetBreakdown;
  logistics: LogisticsInfo;
  curatedItinerary: DayItinerary[];
  hotelRecommendations: HotelRecommendation[];
  proTip: string;
  liveContextHighlights?: string[];
  localFestivalOrEvent?: string;
  isFavorite?: boolean;
  generatedAt: string;
}

export interface McpToolInvocation {
  id: string;
  server: string;
  tool: string;
  arguments: Record<string, any>;
  durationMs: number;
  status: 'success' | 'warning' | 'error';
  resultPreview: string;
  timestamp: string;
}

export interface GenerateTripsResponse {
  destinations: DestinationItem[];
  mcpTrace: McpToolInvocation[];
  meta: {
    modelUsed: string;
    origin: string;
    executionTimeMs: number;
    generatedAt: string;
    isSurpriseMe: boolean;
  };
}

export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD';

export interface CurrencyRate {
  symbol: string;
  rateAgainstUSD: number;
}
