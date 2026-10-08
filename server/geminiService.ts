/**
 * Core LLM Service for Wanderlust AI
 * Uses @google/genai with gemini-3.8-flash and structured JSON responseSchema,
 * augmented with real-time Model Context Protocol (MCP) tool integrations.
 */

import { GoogleGenAI, Type } from '@google/genai';
import {
  DestinationItem,
  GenerateTripsResponse,
  McpToolInvocation,
  SearchPreferences,
} from '../src/types/travel.js';
import {
  executeMcpDestinationVisuals,
  executeMcpFlightProximity,
  executeMcpLiveTravelContext,
  resolveHotelPhoto,
} from './mcpTools.ts';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
        timeout: 15000,
      },
    });
  }
  return aiClient;
}

const DESTINATIONS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    destinations: {
      type: Type.ARRAY,
      description: 'List of exactly 3 distinct, tailored vacation destinations.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Destination city, region, or island name' },
          country: { type: Type.STRING, description: 'Country of the destination' },
          region: { type: Type.STRING, description: 'Geographic region or continent' },
          hook: { type: Type.STRING, description: 'Captivating, evocative 1-sentence hook' },
          relevanceRationale: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '2 to 3 bullet points explicitly connecting the suggestion to user preferences',
          },
          vibeTags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 to 5 evocative tags (e.g., Coastal Charm, Culinary Haven, Hidden Valleys)',
          },
          climateMatch: {
            type: Type.STRING,
            description: 'Short phrase describing the seasonal climate match',
          },
          budget: {
            type: Type.OBJECT,
            properties: {
              tier: { type: Type.STRING, description: '$, $$, $$$, or $$$$' },
              dailyStayUsd: { type: Type.NUMBER, description: 'Estimated daily accommodation cost in USD' },
              dailyFoodUsd: { type: Type.NUMBER, description: 'Estimated daily food & drink cost in USD' },
              dailyTransportUsd: { type: Type.NUMBER, description: 'Estimated daily local transit cost in USD' },
              dailyTotalUsd: { type: Type.NUMBER, description: 'Estimated total daily spend in USD' },
              localCurrencyCode: { type: Type.STRING, description: 'e.g., JPY, EUR, MXN, USD' },
              localCurrencySymbol: { type: Type.STRING, description: 'e.g., ¥, €, $, ₱' },
            },
            required: ['tier', 'dailyStayUsd', 'dailyFoodUsd', 'dailyTransportUsd', 'dailyTotalUsd', 'localCurrencyCode', 'localCurrencySymbol'],
          },
          logistics: {
            type: Type.OBJECT,
            properties: {
              primaryAirportCode: { type: Type.STRING, description: 'Main airport 3-letter IATA code' },
              primaryAirportName: { type: Type.STRING, description: 'Airport full name' },
              visaSnapshot: { type: Type.STRING, description: 'Visa / entry summary for standard international travelers' },
              bestNeighborhood: { type: Type.STRING, description: 'Top recommended neighborhood or quarter to stay' },
            },
            required: ['primaryAirportCode', 'primaryAirportName', 'visaSnapshot', 'bestNeighborhood'],
          },
          curatedItinerary: {
            type: Type.ARRAY,
            description: 'Curated 3-Day Highlight Itinerary',
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.NUMBER, description: '1, 2, or 3' },
                title: { type: Type.STRING, description: 'Catchy day title' },
                morning: { type: Type.STRING, description: 'Morning activity and iconic landmark' },
                afternoon: { type: Type.STRING, description: 'Afternoon deep cultural or adventure activity' },
                evening: { type: Type.STRING, description: 'Evening culinary crawl or sunset hidden gem' },
                highlightType: {
                  type: Type.STRING,
                  description: 'One of: arrival_landmark, culture_adventure, food_hidden_gem',
                },
              },
              required: ['day', 'title', 'morning', 'afternoon', 'evening', 'highlightType'],
            },
          },
          hotelRecommendations: {
            type: Type.ARRAY,
            description: '2 to 3 curated hotel and accommodation recommendations tailored to budget and group dynamic',
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: 'Hotel, ryokan, or eco-lodge name' },
                tier: { type: Type.STRING, description: 'One of: Boutique, Luxury, Eco-Lodge, Budget / Hostel, Historic Heritage' },
                pricePerNightUsd: { type: Type.NUMBER, description: 'Approximate nightly room rate in USD' },
                neighborhood: { type: Type.STRING, description: 'Neighborhood or quarter location' },
                vibe: { type: Type.STRING, description: '1-sentence evocative description of property character' },
                amenities: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3 to 4 standout amenities',
                },
                bookingNote: { type: Type.STRING, description: 'Booking advice or lead time tip' },
                rating: { type: Type.NUMBER, description: 'Review rating out of 5 (e.g. 4.8)' },
              },
              required: ['name', 'tier', 'pricePerNightUsd', 'neighborhood', 'vibe', 'amenities', 'bookingNote', 'rating'],
            },
          },
          proTip: {
            type: Type.STRING,
            description: 'One authentic insider pro-tip (transit etiquette, secret lookout, timing quirk)',
          },
        },
        required: [
          'name',
          'country',
          'region',
          'hook',
          'relevanceRationale',
          'vibeTags',
          'climateMatch',
          'budget',
          'logistics',
          'curatedItinerary',
          'hotelRecommendations',
          'proTip',
        ],
      },
    },
  },
  required: ['destinations'],
};

export async function generateTailoredTrips(prefs: SearchPreferences): Promise<GenerateTripsResponse> {
  const startTime = Date.now();
  const mcpTrace: McpToolInvocation[] = [];

  const prompt = `
Generate 3 diverse, hyper-tailored vacation ideas on the fly based on these traveler criteria:

- Travel Persona / Vibe: ${prefs.persona}
- Budget Tier: ${prefs.budgetTier}
- Group Dynamic: ${prefs.groupDynamic}
- Trip Length: ${prefs.customTripDays ? `${prefs.customTripDays} days (custom traveler duration)` : prefs.tripLength}
- Travel Timing / Season: ${prefs.travelTiming || 'Flexible / Upcoming season'}
- Origin City / Departure Airport: ${prefs.originCity || 'New York (JFK)'}
- Maximum Flight Duration: ${prefs.maxFlightDuration}
- Climate Bias: ${prefs.climateBias}
${prefs.customNotes ? `- Custom Traveler Notes: ${prefs.customNotes}` : ''}
${prefs.isSurpriseMe ? '- Special Mode: "Surprise Me / Wildcard". Offer unexpected, off-the-beaten-path hidden gems that delight adventurous travelers.' : ''}

Ensure each destination option has:
1. A unique character and angle (avoid 3 repetitive beach or mountain spots).
2. Explicit relevance rationale detailing why it matches the selected budget (${prefs.budgetTier}), group dynamic (${prefs.groupDynamic}), and vibe (${prefs.persona}).
3. Realistic, grounded USD daily budget estimates.
4. A punchy, evocative 1-sentence hook.
5. A detailed 3-Day highlight itinerary (Day 1: Arrival & Landmark; Day 2: Culture & Adventure; Day 3: Local Food & Hidden Gem).
6. Primary airport code and recommended neighborhood.
7. 2 to 3 tailored hotel and stay recommendations (boutique, luxury, eco-lodge, or heritage stay) matching their budget tier and group dynamic with pricing per night, neighborhood, and amenities.
`;

  let rawDestinations: any[] = [];
  let modelUsed = 'gemini-3.1-flash-lite';

  const hasApiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);

  if (hasApiKey) {
    try {
      const ai = getAiClient();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('LLM call timed out after 14s')), 14000)
      );

      const callPromise = (async () => {
        return await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            systemInstruction:
              'You are Wanderlust AI, an elite travel architect and curator. Return strictly validated JSON satisfying the schema. Every destination must feel authentic, evocative, and distinctly tailored to the traveler.',
            responseMimeType: 'application/json',
            responseSchema: DESTINATIONS_SCHEMA,
            temperature: prefs.isSurpriseMe ? 1.0 : 0.75,
          },
        });
      })();

      const response = await Promise.race([callPromise, timeoutPromise]);
      const text = response.text || '';
      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed.destinations) && parsed.destinations.length > 0) {
        rawDestinations = parsed.destinations;
        modelUsed = 'gemini-3.1-flash-lite';
      }
    } catch (err: any) {
      console.warn('Gemini API call warning, falling back to smart synthesized generator:', err?.message || err);
      rawDestinations = generateFallbackDestinations(prefs);
      modelUsed = 'gemini-3.1-flash-lite (synthetic fallback)';
    }
  } else {
    rawDestinations = generateFallbackDestinations(prefs);
    modelUsed = 'wanderlust-smart-curator (offline engine)';
  }

  if (!rawDestinations || rawDestinations.length === 0) {
    rawDestinations = generateFallbackDestinations(prefs);
  }

  // MCP Enrichment Pipeline
  // For each destination, run MCP tools:
  // 1. Destination Visuals & Geo
  // 2. Flight Proximity & Router
  // 3. Live Travel Context & Advisories
  const enrichedDestinations: DestinationItem[] = [];

  for (let i = 0; i < rawDestinations.length; i++) {
    const raw = rawDestinations[i];
    const destId = `dest_${Date.now()}_${i + 1}`;

    // MCP Tool 1: Visuals & Geo
    const t1Start = Date.now();
    const visuals = await executeMcpDestinationVisuals(raw.name, raw.country, prefs.persona);
    const t1Duration = Date.now() - t1Start;
    mcpTrace.push({
      id: `call_mcp_geo_${destId}`,
      server: 'mcp-server-visuals-geo (v1.2.0)',
      tool: 'mcp_destination_visuals',
      arguments: { destinationName: raw.name, country: raw.country, vibe: prefs.persona },
      durationMs: t1Duration,
      status: 'success',
      resultPreview: `Retrieved high-res photo by ${visuals.heroPhoto.photographer}, coordinates [${visuals.geo.lat}, ${visuals.geo.lng}], and weather condition: "${visuals.weather.condition}"`,
      timestamp: new Date().toISOString(),
    });

    // MCP Tool 2: Flight Proximity
    const t2Start = Date.now();
    const airportCode = raw.logistics?.primaryAirportCode || 'XYZ';
    const flightRoute = await executeMcpFlightProximity(
      prefs.originCity || 'JFK',
      raw.name,
      airportCode,
      visuals.geo.lat,
      visuals.geo.lng
    );
    const t2Duration = Date.now() - t2Start;
    mcpTrace.push({
      id: `call_mcp_flight_${destId}`,
      server: 'mcp-server-flight-router (v2.1.0)',
      tool: 'mcp_flight_proximity',
      arguments: {
        originCity: prefs.originCity || 'JFK',
        destinationName: raw.name,
        airportCode,
        lat: visuals.geo.lat,
        lng: visuals.geo.lng,
      },
      durationMs: t2Duration,
      status: 'success',
      resultPreview: `Calculated transit: ${flightRoute.flightDurationEstimate} (${flightRoute.estimatedDistanceKm} km), route: ${flightRoute.transitHubs}, carbon est: ${flightRoute.carbonFootprintKg} kg CO2`,
      timestamp: new Date().toISOString(),
    });

    // MCP Tool 3: Live Travel Context
    const t3Start = Date.now();
    const liveContext = await executeMcpLiveTravelContext(raw.name, raw.country, prefs.travelTiming);
    const t3Duration = Date.now() - t3Start;
    mcpTrace.push({
      id: `call_mcp_context_${destId}`,
      server: 'mcp-server-travel-context-grounding (v1.0.4)',
      tool: 'mcp_live_travel_context',
      arguments: { destinationName: raw.name, country: raw.country, travelTiming: prefs.travelTiming },
      durationMs: t3Duration,
      status: 'success',
      resultPreview: `Attached seasonal festival: "${liveContext.festivalOrEvent}", plus 3 seasonal advisories and visa snapshot.`,
      timestamp: new Date().toISOString(),
    });

    // Resolve hotel recommendations with photos
    const hotelRecs = (Array.isArray(raw.hotelRecommendations) && raw.hotelRecommendations.length > 0
      ? raw.hotelRecommendations
      : getDefaultHotels(raw.name, raw.country, prefs.budgetTier)
    ).map((h: any) => ({
      name: h.name,
      tier: h.tier || 'Boutique',
      pricePerNightUsd: Number(h.pricePerNightUsd) || (raw.budget?.dailyStayUsd ? Math.round(raw.budget.dailyStayUsd * 1.3) : 160),
      neighborhood: h.neighborhood || raw.logistics?.bestNeighborhood || 'City Center',
      vibe: h.vibe || 'Charming local accommodations with authentic character and attentive hospitality.',
      amenities: Array.isArray(h.amenities) && h.amenities.length > 0
        ? h.amenities
        : ['Free High-Speed Wi-Fi', 'Breakfast Included', 'Terrace View', 'Concierge Service'],
      bookingNote: h.bookingNote || 'Reserve 4-8 weeks in advance during high season.',
      rating: Number(h.rating) || 4.8,
      photoUrl: h.photoUrl || resolveHotelPhoto(h.name, raw.name),
    }));

    // Merge into complete DestinationItem
    enrichedDestinations.push({
      id: destId,
      name: raw.name,
      country: raw.country,
      region: raw.region || 'Global',
      hook: raw.hook,
      heroPhoto: visuals.heroPhoto,
      secondaryPhotos: visuals.secondaryPhotos,
      relevanceRationale: raw.relevanceRationale || [],
      vibeTags: raw.vibeTags || ['Scenic', 'Cultural'],
      climateMatch: raw.climateMatch || visuals.weather.condition,
      geoCoordinates: visuals.geo,
      weather: visuals.weather,
      budget: {
        tier: raw.budget?.tier || prefs.budgetTier,
        dailyStayUsd: raw.budget?.dailyStayUsd || 120,
        dailyFoodUsd: raw.budget?.dailyFoodUsd || 50,
        dailyTransportUsd: raw.budget?.dailyTransportUsd || 25,
        dailyTotalUsd:
          raw.budget?.dailyTotalUsd ||
          (raw.budget?.dailyStayUsd || 120) + (raw.budget?.dailyFoodUsd || 50) + (raw.budget?.dailyTransportUsd || 25),
        localCurrencyCode: raw.budget?.localCurrencyCode || 'USD',
        localCurrencySymbol: raw.budget?.localCurrencySymbol || '$',
      },
      logistics: {
        primaryAirportCode: airportCode,
        primaryAirportName: raw.logistics?.primaryAirportName || `${raw.name} Regional Airport`,
        flightDurationEstimate: flightRoute.flightDurationEstimate,
        directFlightAvailable: flightRoute.directFlightAvailable,
        transitHubs: flightRoute.transitHubs,
        estimatedDistanceKm: flightRoute.estimatedDistanceKm,
        carbonFootprintKg: flightRoute.carbonFootprintKg,
        visaSnapshot: raw.logistics?.visaSnapshot || liveContext.visaSnapshot,
        bestNeighborhood: raw.logistics?.bestNeighborhood || 'Old Town Quarter',
      },
      curatedItinerary: raw.curatedItinerary || [],
      hotelRecommendations: hotelRecs,
      proTip: raw.proTip || 'Wake early to enjoy the historical districts before tour groups arrive.',
      liveContextHighlights: liveContext.highlights,
      localFestivalOrEvent: liveContext.festivalOrEvent,
      generatedAt: new Date().toISOString(),
    });
  }

  const executionTimeMs = Date.now() - startTime;

  return {
    destinations: enrichedDestinations,
    mcpTrace,
    meta: {
      modelUsed,
      origin: prefs.originCity || 'New York (JFK)',
      executionTimeMs,
      generatedAt: new Date().toISOString(),
      isSurpriseMe: Boolean(prefs.isSurpriseMe),
    },
  };
}

/**
 * Curated hotel directory per destination
 */
function getDefaultHotels(destName: string, country: string, budgetTier: string): any[] {
  const norm = destName.toLowerCase();

  if (norm.includes('dolomite') || norm.includes('gardena')) {
    return [
      {
        name: 'Forestis Dolomites',
        tier: 'Luxury',
        pricePerNightUsd: 380,
        neighborhood: 'Palmschoß / Bressanone',
        vibe: 'Modern carbon-neutral alpine hideaway offering panoramic views of the Odle peaks and stone thermal baths.',
        amenities: ['Indoor/Outdoor Heated Pool', 'Forest Cuisine Dining', 'Sauna Rituals', 'Ski-in/Ski-out Access'],
        bookingNote: 'Book 8-12 weeks in advance for terrace suites facing south.',
        rating: 4.9,
      },
      {
        name: 'Garni Hotel & Rifugio Ansitz Jakoberhof',
        tier: 'Boutique',
        pricePerNightUsd: 145,
        neighborhood: 'Ortisei / St. Ulrich',
        vibe: 'Warm traditional Tyrolean wooden lodge with homemade mountain breakfasts and meadow trails out front.',
        amenities: ['Complimentary Cable Car Pass', 'Alpine Sauna', 'Free Mountain Bikes', 'Panoramic Garden'],
        bookingNote: 'Family-run property with excellent local dining advice.',
        rating: 4.8,
      },
    ];
  }

  if (norm.includes('queenstown') || norm.includes('fiordland')) {
    return [
      {
        name: 'Matakauri Lodge',
        tier: 'Luxury',
        pricePerNightUsd: 460,
        neighborhood: 'Lake Wakatipu Shoreline',
        vibe: 'Spectacular floor-to-ceiling glass alpine pavilions gazing across the Remarkables mountain range.',
        amenities: ['Infinity Jacuzzi', 'Private Chef Dining', 'Complimentary Pre-Dinner Canapés', 'Spa Sanctuaries'],
        bookingNote: 'Ideal for romantic escapes and milestone anniversaries.',
        rating: 4.9,
      },
      {
        name: 'Sherwood Eco-Retreat & Farm Hotel',
        tier: 'Eco-Lodge',
        pricePerNightUsd: 135,
        neighborhood: 'Frankton Arm Waterfront',
        vibe: 'Community-led sustainable haven with organic kitchen gardens, solar power, and natural wine lounge.',
        amenities: ['Organic Farm-to-Table Restaurant', 'Daily Morning Yoga', 'Boutique Coffee Roastery', 'Live Acoustic Music'],
        bookingNote: 'Top choice for eco-conscious adventurers and friends.',
        rating: 4.7,
      },
    ];
  }

  if (norm.includes('azores') || norm.includes('miguel')) {
    return [
      {
        name: 'Terra Nostra Garden Hotel',
        tier: 'Historic Heritage',
        pricePerNightUsd: 165,
        neighborhood: 'Furnas Valley',
        vibe: 'Art Deco historic grand hotel nestled within a 200-year-old botanical park with 24/7 geothermal spring access.',
        amenities: ['Private Thermal Hot Spring Access', 'Centuries-old Botanic Gardens', 'Local Azorean Tasting Menu', 'Wellness Spa'],
        bookingNote: 'Guests enjoy exclusive night access to the illuminated hot pools after public hours.',
        rating: 4.9,
      },
      {
        name: 'Santa Bárbara Eco-Beach Resort',
        tier: 'Eco-Lodge',
        pricePerNightUsd: 180,
        neighborhood: 'Ribeira Grande Surf Coast',
        vibe: 'Minimalist sustainable cliff villas framed by black sand waves and native cryptomeria timber.',
        amenities: ['Oceanfront Saltwater Pool', 'Surf Gear Rental', 'Farm-to-Table Sushi & Tapas', 'Sunset Beach Club'],
        bookingNote: 'Book beach-facing villas with private plunge pools.',
        rating: 4.8,
      },
    ];
  }

  if (norm.includes('oaxaca')) {
    return [
      {
        name: 'Hotel Sin Nombre',
        tier: 'Boutique',
        pricePerNightUsd: 195,
        neighborhood: 'Centro Histórico (near Santo Domingo)',
        vibe: 'Minimalist North African influenced 17th-century mansion featuring sandstone arches and intimate courtyard plunge pools.',
        amenities: ['Rooftop Mezcal Bar', 'Vegan Gourmet Courtyard', 'Artisan Textile Suites', 'Curated Art Gallery'],
        bookingNote: 'Centrally located within two blocks of Santo Domingo church.',
        rating: 4.9,
      },
      {
        name: 'Casa Santo Origen',
        tier: 'Luxury',
        pricePerNightUsd: 260,
        neighborhood: 'San Felipe del Agua Foothills',
        vibe: 'Exclusive peaceful 8-suite sanctuary tucked into the mountain breeze with Mediterranean-Oaxacan architecture.',
        amenities: ['Heated Pool Garden', 'Bespoke Mezcal Pairing', 'Private Chef Breakfast', 'Personal Butler Service'],
        bookingNote: 'Peaceful retreat outside city bustle; 10 min taxi to downtown.',
        rating: 4.9,
      },
    ];
  }

  if (norm.includes('amalfi') || norm.includes('positano') || norm.includes('ravello')) {
    return [
      {
        name: 'Palazzo Avino (The Pink Palace)',
        tier: 'Luxury',
        pricePerNightUsd: 490,
        neighborhood: 'Ravello Clifftops',
        vibe: '12th-century medieval palazzo perched 1,000 feet above the sapphire Mediterranean with private beach club.',
        amenities: ['Michelin-Starred Rossellinis', 'Private Beach Club Access', 'Heated Clifftop Pool', 'Lobster & Martini Bar'],
        bookingNote: 'Prime vantage point in tranquil Ravello away from ferry crowds.',
        rating: 4.9,
      },
      {
        name: 'Villa Boheme Exclusive Suites',
        tier: 'Boutique',
        pricePerNightUsd: 310,
        neighborhood: 'Positano Hills',
        vibe: 'Romantic bougainvillea-draped terrace suites overlooking the pastel cascade of Positano village.',
        amenities: ['Panoramic Private Terraces', 'Complimentary Champagne Breakfast', 'Hydro-massage Tubs', 'Concierge Boat Charters'],
        bookingNote: 'Book 3-4 months ahead for peak summer months.',
        rating: 4.8,
      },
    ];
  }

  if (norm.includes('kyoto')) {
    return [
      {
        name: 'Hoshinoya Kyoto',
        tier: 'Luxury',
        pricePerNightUsd: 450,
        neighborhood: 'Arashiyama River Gorge',
        vibe: 'Secluded 100-year-old riverside ryokan reached exclusively by private traditional wooden boat along the Oi River.',
        amenities: ['Morning Monk Temple Chanting', 'Seasonal Kaiseki Gastronomy', 'Tatami Living Pavilions', 'Private Water Garden'],
        bookingNote: 'Water taxi departure point right next to Togetsukyo Bridge.',
        rating: 4.9,
      },
      {
        name: 'The Machiya Kamiumeya',
        tier: 'Boutique',
        pricePerNightUsd: 140,
        neighborhood: 'Higashiyama / Gion Border',
        vibe: 'Artfully restored heritage machiya townhouse blending traditional lattice wood with Scandinavian comforts.',
        amenities: ['Japanese Hinoki Cedar Baths', 'Complimentary Matcha Tea Bar', 'Bicycle Rentals', 'Private Garden Courtyard'],
        bookingNote: 'Walkable to Kiyomizu-dera and Gion Shirakawa.',
        rating: 4.8,
      },
    ];
  }

  if (norm.includes('san sebasti') || norm.includes('donostia')) {
    return [
      {
        name: 'Hotel Maria Cristina (Luxury Collection)',
        tier: 'Luxury',
        pricePerNightUsd: 360,
        neighborhood: 'Centro / Urumea Riverfront',
        vibe: 'Belle Époque palace from 1912 hosting film festival stars, steps from legendary Parte Vieja pintxos bars.',
        amenities: ['Basque Culinary Masterclasses', 'Historic Dry Martini Bar', 'Marble Bathrooms', 'Valet Parking'],
        bookingNote: 'Ask for high-floor suites overlooking the Urumea River and Victoria Eugenia Theatre.',
        rating: 4.8,
      },
      {
        name: 'Arbaso Hotel',
        tier: 'Boutique',
        pricePerNightUsd: 175,
        neighborhood: 'San Martín Shopping Quarter',
        vibe: 'Warm Basque craftsmanship featuring hand-hewn local oak, organic textures, and charcoal-grilled dining.',
        amenities: ['Michelin-recommended Narru Restaurant', 'Nordic Sauna', 'Custom Artisan Bedding', 'Electric Bikes'],
        bookingNote: 'Just a 4-minute stroll to La Concha beachfront.',
        rating: 4.8,
      },
    ];
  }

  if (norm.includes('tromso') || norm.includes('senja')) {
    return [
      {
        name: 'Sommarøy Arctic Hotel',
        tier: 'Boutique',
        pricePerNightUsd: 210,
        neighborhood: 'Sommarøy Island Fjords',
        vibe: 'Fisherman seaside rorbuer cabins and glass-roof aurora pavilions perched right on white coral Arctic beaches.',
        amenities: ['Wood-fired Floating Fjord Sauna', 'Aurora Wake-Up Call Service', 'Fresh Arctic Seafood Restaurant', 'Sea Kayak Excursions'],
        bookingNote: 'Scenic 45-min drive from Tromsø center; virtually zero light pollution for aurora viewing.',
        rating: 4.8,
      },
      {
        name: 'Clarion Collection Hotel With',
        tier: 'Historic Heritage',
        pricePerNightUsd: 155,
        neighborhood: 'Tromsø Historic Harbor',
        vibe: 'Nautical-themed harbor warehouse overlooking the Arctic Cathedral with complimentary evening waffles and dinner.',
        amenities: ['Free Afternoon Waffles & Evening Buffet', 'Harbor Sauna', 'Waterfront Views', 'Centrally Walkable'],
        bookingNote: 'Exceptional value in high-cost Scandinavia with meals included.',
        rating: 4.7,
      },
    ];
  }

  // Generic tailored stays for any other destination
  const isBudget = budgetTier === 'backpacker';
  const isLuxe = budgetTier === 'luxury' || budgetTier === 'ultraluxe';

  return [
    {
      name: isLuxe ? `The Royal Heritage Palace of ${destName}` : `Boutique Casa ${destName}`,
      tier: isLuxe ? 'Luxury' : 'Boutique',
      pricePerNightUsd: isLuxe ? 320 : isBudget ? 55 : 140,
      neighborhood: 'Historic Old Quarter',
      vibe: `Refined design-forward stay celebrating authentic local architecture and artisanal textures in ${destName}.`,
      amenities: ['Rooftop Sunset Lounge', 'Artisan Local Breakfast', 'Concierge Excursions', 'High-Speed Wi-Fi'],
      bookingNote: 'Centrally situated within walking distance of key monuments and local dining.',
      rating: 4.8,
    },
    {
      name: isBudget ? `Nomad Haven & Social House ${destName}` : `The Sanctuary Eco-Lodge & Spa`,
      tier: isBudget ? 'Budget / Hostel' : 'Eco-Lodge',
      pricePerNightUsd: isBudget ? 35 : isLuxe ? 280 : 110,
      neighborhood: 'Artisanal Green Belt',
      vibe: `Tranquil retreat emphasizing sustainable hospitality, local materials, and relaxing natural surroundings.`,
      amenities: ['Garden Terrace', 'Complimentary Bicycles', 'Organic Kitchen', 'Quiet Reading Lounge'],
      bookingNote: 'Peaceful setting with quick transit access into the city core.',
      rating: 4.7,
    },
  ];
}


/**
 * High quality curated fallback generator ensuring 100% resilience
 */
function generateFallbackDestinations(prefs: SearchPreferences): any[] {
  const isAdventure = prefs.persona === 'adventure' || prefs.persona === 'roadtrip';
  const isChill = prefs.persona === 'tropical' || prefs.persona === 'wellness';
  const isCulture = prefs.persona === 'culture' || prefs.persona === 'foodie';

  if (isAdventure) {
    return [
      {
        name: 'Dolomites (Val Gardena)',
        country: 'Italy',
        region: 'Southern Alps',
        hook: 'Towering pale limestone spires rising above emerald meadows and rustic alpine rifugios.',
        relevanceRationale: [
          `Tailored for ${prefs.persona}: world-class via ferrata climbs, dramatic ridgeline treks, and alpine passes.`,
          `Matches ${prefs.budgetTier} tier: mountain huts offer authentic half-board lodging with incredible local polenta and speck.`,
          `Ideal for ${prefs.groupDynamic}: scenic gondola networks allow varying fitness levels to summit iconic peaks together.`,
        ],
        vibeTags: ['Alpine Splendor', 'Dramatic Peaks', 'Via Ferrata', 'Rustic Refuges'],
        climateMatch: 'Crisp alpine air with clear high-altitude sunshine',
        budget: {
          tier: '$$',
          dailyStayUsd: 135,
          dailyFoodUsd: 55,
          dailyTransportUsd: 30,
          dailyTotalUsd: 220,
          localCurrencyCode: 'EUR',
          localCurrencySymbol: '€',
        },
        logistics: {
          primaryAirportCode: 'VCE',
          primaryAirportName: 'Venice Marco Polo Airport',
          visaSnapshot: 'Schengen 90-day tourist entry; no visa needed for US/EU travelers.',
          bestNeighborhood: 'Ortisei / St. Ulrich',
        },
        curatedItinerary: [
          {
            day: 1,
            title: 'Arrival in the Pale Mountains & Alpe di Siusi',
            morning: 'Scenic arrival drive into Val Gardena; board the Mont Sëuc gondola for a 360° meadow panorama.',
            afternoon: 'Hike the gentle rolling trails across Alpe di Siusi framed by the dramatic Sassolungo peak.',
            evening: 'Dine on homemade canederli dumplings and South Tyrolean Lagrein wine at a historic wooden stube.',
            highlightType: 'arrival_landmark',
          },
          {
            day: 2,
            title: 'Seceda Ridgeline Trek & Cliffside Rifugio',
            morning: 'Early morning cable car to Seceda ridge (2,500m) to witness jagged peaks piercing drifting clouds.',
            afternoon: 'Traverse the Odle trail toward Rifugio Firenze for an alpine lunch with panoramic valley views.',
            evening: 'Relax in a wood-fired sauna before enjoying sunset alpenglow turning the summits brilliant crimson.',
            highlightType: 'culture_adventure',
          },
          {
            day: 3,
            title: 'Sella Pass & Artisan Woodcarver Studios',
            morning: 'Drive the hairpin turns of Passo Sella; stop for espresso beneath towering limestone precipices.',
            afternoon: 'Explore the centuries-old traditional woodcarving workshops of Ortisei artisans.',
            evening: 'Farewell feast featuring Schlutzkrapfen ravioli and apple strudel with warm vanilla cream.',
            highlightType: 'food_hidden_gem',
          },
        ],
        proTip: 'Download the Val Gardena Mobilcard for free unlimited valley buses and leave your rental car parked.',
      },
      {
        name: 'Queenstown & Fiordland',
        country: 'New Zealand',
        region: 'South Island',
        hook: 'The Southern Hemisphere adventure capital wrapped around deep glacial fjords and cinematic ranges.',
        relevanceRationale: [
          `Perfect match for ${prefs.persona}: world-renowned hiking tracks (Routeburn, Milford), jet-boating, and canyon swings.`,
          `Fits your ${prefs.budgetTier} allocation with vibrant boutique motels and hearty lakeside eateries.`,
          `Suited to ${prefs.groupDynamic}: incredible outdoor camaraderie and friendly local Kiwi hospitality.`,
        ],
        vibeTags: ['Adventure Capital', 'Glacial Fjords', 'Lord of the Rings Scenery', 'Lakeside Bliss'],
        climateMatch: 'Mild temperate maritime with crisp, invigorating mountain breezes',
        budget: {
          tier: '$$$',
          dailyStayUsd: 170,
          dailyFoodUsd: 65,
          dailyTransportUsd: 45,
          dailyTotalUsd: 280,
          localCurrencyCode: 'NZD',
          localCurrencySymbol: 'NZ$',
        },
        logistics: {
          primaryAirportCode: 'ZQN',
          primaryAirportName: 'Queenstown International Airport',
          visaSnapshot: 'NZeTA electronic travel authority required before flight departure.',
          bestNeighborhood: 'Queenstown Waterfront & Frankton Arm',
        },
        curatedItinerary: [
          {
            day: 1,
            title: 'Lake Wakatipu & Skyline Gondola',
            morning: 'Arrive at one of the world’s most scenic airport approaches; stroll Queenstown Gardens lakeside trail.',
            afternoon: 'Ascend Bob’s Peak via Skyline Gondola for panoramic views of the Remarkables range and downhill luge runs.',
            evening: 'Savor a legendary gourmet Fergburger followed by craft IPAs at a cozy wood-burning taproom.',
            highlightType: 'arrival_landmark',
          },
          {
            day: 2,
            title: 'Milford Sound Wilderness Expedition',
            morning: 'Scenic overland coach through ancient beech forests and the engineering marvel Homer Tunnel.',
            afternoon: 'Cruise beneath vertical granite cliffs and mist-shrouded Stirling Falls with resident fur seals.',
            evening: 'Return to town for a relaxing lakeside wine tasting of award-winning Central Otago Pinot Noir.',
            highlightType: 'culture_adventure',
          },
          {
            day: 3,
            title: 'Historic Arrowtown & Dart River Hidden Canyons',
            morning: 'Wander 1860s gold-rush cottages and leaf-dappled avenues of quaint Arrowtown.',
            afternoon: 'Jet-boat excursion deep into the braided channels and turquoise glaciers of Mount Aspiring National Park.',
            evening: 'Dine at a historic woolshed restaurant overlooking moonlit Lake Wakatipu.',
            highlightType: 'food_hidden_gem',
          },
        ],
        proTip: 'Book the Milford Sound nature cruise on the earliest morning departure to avoid tour coach congestion.',
      },
      {
        name: 'São Miguel, Azores',
        country: 'Portugal',
        region: 'Mid-Atlantic',
        hook: 'The Hawaii of Europe: volcanic crater lakes, thermal hot springs, and emerald hydrangeas.',
        relevanceRationale: [
          `Authentic adventure: hike dormant calderas, swim beneath geothermal waterfalls, and kayak twin volcanic lakes.`,
          `Excellent value for ${prefs.budgetTier}: delicious seafood and thermal baths remain remarkably budget-friendly.`,
          `Relaxed, uncrowded island rhythm perfectly attuned to ${prefs.groupDynamic}.`,
        ],
        vibeTags: ['Volcanic Lakes', 'Geothermal Baths', 'Tea Plantations', 'Atlantic Wilds'],
        climateMatch: 'Subtropical oceanic; mild and lush year-round',
        budget: {
          tier: '$',
          dailyStayUsd: 90,
          dailyFoodUsd: 40,
          dailyTransportUsd: 35,
          dailyTotalUsd: 165,
          localCurrencyCode: 'EUR',
          localCurrencySymbol: '€',
        },
        logistics: {
          primaryAirportCode: 'PDL',
          primaryAirportName: 'João Paulo II Airport (Ponta Delgada)',
          visaSnapshot: 'Standard 90-day EU Schengen tourist entry.',
          bestNeighborhood: 'Ponta Delgada Historic Center',
        },
        curatedItinerary: [
          {
            day: 1,
            title: 'Sete Cidades Caldera & Miradouro da Boca do Inferno',
            morning: 'Arrive in Ponta Delgada; drive up to the iconic Boca do Inferno lookout over twin green and blue lakes.',
            afternoon: 'Hike the caldera rim before kayaking the glassy waters of Sete Cidades lake bed.',
            evening: 'Fresh grilled limpets (lapas) with garlic butter and Azorean white wine in Mosteiros at sunset.',
            highlightType: 'arrival_landmark',
          },
          {
            day: 2,
            title: 'Furnas Thermal Baths & Cozido Volcanic Stew',
            morning: 'Witness bubbling sulfur fumaroles where traditional earthenware pots stew underground for 6 hours.',
            afternoon: 'Submerge in the iron-rich thermal springs of Terra Nostra botanical garden surrounded by ancient ferns.',
            evening: 'Feast on the famous Cozido das Furnas paired with fresh Azorean pineapple.',
            highlightType: 'culture_adventure',
          },
          {
            day: 3,
            title: 'Gorreana Tea Estate & Nordeste Waterfalls',
            morning: 'Tour Europe’s only active tea plantation with panoramic terraces rolling down to the ocean.',
            afternoon: 'Hike to the secluded waterfall of Salto do Prego nestled in lush endemic laurisilva forest.',
            evening: 'Wander Ponta Delgada’s black basalt cobblestone promenade with local artisanal gelato.',
            highlightType: 'food_hidden_gem',
          },
        ],
        proTip: 'Pack a dark swimsuit for Terra Nostra hot springs as the rich natural iron minerals will stain light fabric.',
      },
    ];
  }

  if (isChill) {
    return [
      {
        name: 'Oaxaca de Juárez',
        country: 'Mexico',
        region: 'Central Valleys',
        hook: 'The culinary soul of Mexico, wrapped in colonial pastel courtyards, artisanal mezcal, and indigenous textile heritage.',
        relevanceRationale: [
          `Vibe match: relaxed morning cafés, open-air art markets, and leisurely multi-course mole tastings.`,
          `Perfect for ${prefs.budgetTier}: luxury boutique stays and Michelin-level dining at a fraction of global costs.`,
          `Intimate, walkable city core ideal for ${prefs.groupDynamic}.`,
        ],
        vibeTags: ['Gastronomy Capital', 'Artisanal Mezcal', 'Zapotec Ruins', 'Vibrant Markets'],
        climateMatch: 'Eternal spring; dry warm afternoons and balmy star-lit evenings',
        budget: {
          tier: '$$',
          dailyStayUsd: 110,
          dailyFoodUsd: 45,
          dailyTransportUsd: 15,
          dailyTotalUsd: 170,
          localCurrencyCode: 'MXN',
          localCurrencySymbol: 'MX$',
        },
        logistics: {
          primaryAirportCode: 'OAX',
          primaryAirportName: 'Oaxaca Xoxocotlán International Airport',
          visaSnapshot: '180-day tourist card (FMM) granted upon arrival for most nationalities.',
          bestNeighborhood: 'Jalatlaco & Santo Domingo',
        },
        curatedItinerary: [
          {
            day: 1,
            title: 'Santo Domingo & Mercado 20 de Noviembre',
            morning: 'Marvel at the gilded baroque interior of Santo Domingo church and adjacent Ethnobotanical Garden.',
            afternoon: 'Navigate the sizzling Pasillo de Humo (Smoke Hall) for grilled tasajo and handmade tlayudas.',
            evening: 'Rooftop cocktails overlooking the illuminated quarry stone towers of the city square.',
            highlightType: 'arrival_landmark',
          },
          {
            day: 2,
            title: 'Hierve el Agua Petrified Falls & Mezcal Palenque',
            morning: 'Early morning dip in cliffside mineral infinity pools overlooking the Sierra Madre valley.',
            afternoon: 'Visit a family-owned artisanal palenque in Matatlán to witness wild agave roasted in stone pits.',
            evening: 'Multi-course tasting menu exploring seven legendary Oaxacan moles at a courtyard sanctuary.',
            highlightType: 'culture_adventure',
          },
          {
            day: 3,
            title: 'Jalatlaco Murals & Indigenous Weaving Studios',
            morning: 'Quiet stroll through cobblestone Jalatlaco to admire colorful murals and specialty espresso bars.',
            afternoon: 'Hands-on natural cochineal and indigo dye demonstration with Zapotec master weavers in Teotitlán.',
            evening: 'Mezcal tasting paired with artisanal chocolate and chapulines at a boutique bar.',
            highlightType: 'food_hidden_gem',
          },
        ],
        proTip: 'Book the Ethnobotanical Garden English tour at 11 AM promptly as entry is strictly limited by guided group.',
      },
      {
        name: 'Amalfi Coast (Ravello & Positano)',
        country: 'Italy',
        region: 'Campania',
        hook: 'Dramatic clifftops tumbling into azure Mediterranean waters, crowned by fragrant lemon groves and cliffside palazzos.',
        relevanceRationale: [
          `Exudes pure romantic escapism and luxurious Mediterranean relaxation.`,
          `Aligns with your ${prefs.budgetTier} selection with stunning panoramic seaside terrace dining.`,
          `Spectacular backdrop for ${prefs.groupDynamic} to create unforgettable memories.`,
        ],
        vibeTags: ['Seaside Romance', 'Cliffside Villas', 'Limoncello Groves', 'Italian Glamour'],
        climateMatch: 'Sun-drenched Mediterranean warmth with refreshing sea breezes',
        budget: {
          tier: '$$$$',
          dailyStayUsd: 320,
          dailyFoodUsd: 110,
          dailyTransportUsd: 45,
          dailyTotalUsd: 475,
          localCurrencyCode: 'EUR',
          localCurrencySymbol: '€',
        },
        logistics: {
          primaryAirportCode: 'NAP',
          primaryAirportName: 'Naples International Airport',
          visaSnapshot: 'Schengen 90-day visa-free tourist entry.',
          bestNeighborhood: 'Ravello (peaceful) or Positano (vibrant)',
        },
        curatedItinerary: [
          {
            day: 1,
            title: 'Arrival in Positano & Spiaggia Grande',
            morning: 'Private ferry along the sheer cliffs into Positano; check in to a sea-facing bougainvillea villa.',
            afternoon: 'Wander the pastel vertical alleys lined with bespoke linen shops and handmade leather cobblers.',
            evening: 'Candlelit seafood dinner on the beach with spaghetti alle vongole and chilled Greco di Tufo.',
            highlightType: 'arrival_landmark',
          },
          {
            day: 2,
            title: 'Path of the Gods (Sentiero degli Dei) & Ravello Gardens',
            morning: 'Hike the ancient mule path high above the clouds from Bomerano to Nocelle with jaw-dropping drop-offs.',
            afternoon: 'Retreat up into serene Ravello to walk the infinity terrace of Villa Cimbrone hanging over the sea.',
            evening: 'Chamber concert in the gardens followed by homemade lemon ravioli and ice-cold limoncello.',
            highlightType: 'culture_adventure',
          },
          {
            day: 3,
            title: 'Private Wooden Gozzo Boat to Secluded Coves',
            morning: 'Board a traditional wooden boat to swim in the emerald waters of Furore Fiord and hidden sea grottos.',
            afternoon: 'Dock at Da Adolfo for a barefoot lunch of grilled mozzarella in lemon leaves on a private pebble beach.',
            evening: 'Sunset aperitivo at Franco’s Bar watching the Positano cliffside light up like a thousand golden lanterns.',
            highlightType: 'food_hidden_gem',
          },
        ],
        proTip: 'Take the scenic public ferry between coastal villages instead of the congested narrow road buses.',
      },
      {
        name: 'Chiang Mai Old City & Mae Rim',
        country: 'Thailand',
        region: 'Northern Highlands',
        hook: 'Misty golden mountain temples, tranquil boutique eco-resorts, and organic farm-to-table culinary sanctuaries.',
        relevanceRationale: [
          `Wellness and chill: traditional Thai herbal steam spas, temple meditation, and lush bamboo forests.`,
          `Unbeatable value for ${prefs.budgetTier}: five-star spa experiences at accessible daily budgets.`,
          `Peaceful, welcoming environment ideally suited for ${prefs.groupDynamic}.`,
        ],
        vibeTags: ['Temple Serenity', 'Highland Mist', 'Herbal Spas', 'Northern Thai Cuisine'],
        climateMatch: 'Warm, breezy tropical highland climate with cool evenings',
        budget: {
          tier: '$',
          dailyStayUsd: 65,
          dailyFoodUsd: 25,
          dailyTransportUsd: 12,
          dailyTotalUsd: 102,
          localCurrencyCode: 'THB',
          localCurrencySymbol: '฿',
        },
        logistics: {
          primaryAirportCode: 'CNX',
          primaryAirportName: 'Chiang Mai International Airport',
          visaSnapshot: '60-day visa exemption granted upon arrival for most travelers.',
          bestNeighborhood: 'Nimman or Old City Moat',
        },
        curatedItinerary: [
          {
            day: 1,
            title: 'Historic Wats & Lanna Heritage',
            morning: 'Dawn offering with orange-robed monks outside teakwood Wat Phan Tao; fresh coconut water in the courtyard.',
            afternoon: 'Wander ancient temple grounds of Wat Chedi Luang and explore local handicraft boutiques.',
            evening: 'Famous Khao Soi curry egg-noodle soup at a beloved multi-generational open-air shop.',
            highlightType: 'arrival_landmark',
          },
          {
            day: 2,
            title: 'Doi Suthep Sunrise & Ethical Elephant Sanctuary',
            morning: 'Ascend the serpent staircase of Wat Phra That Doi Suthep to catch sunrise breaking over the valley.',
            afternoon: 'Visit an ethical hands-off rescue sanctuary to observe elephants roaming freely in natural jungle rivers.',
            evening: 'Traditional 2-hour Thai herbal compress massage at an open-air teak garden pavilion.',
            highlightType: 'culture_adventure',
          },
          {
            day: 3,
            title: 'Organic Valley Tea Farms & Riverside Night Bazaar',
            morning: 'Scenic mountain drive to Mae Rim; tour an organic Arabica coffee and tea plantation.',
            afternoon: 'Hands-on organic cooking masterclass picking fresh lemongrass and galangal from the farm garden.',
            evening: 'Explore the vibrant Sunday Walking Street market with acoustic Lanna music and street delicacies.',
            highlightType: 'food_hidden_gem',
          },
        ],
        proTip: 'Rent a silent electric scooter or use Grab rides to easily escape the city center into the lush Mae Rim foothills.',
      },
    ];
  }

  // Culture / Foodie / Default
  return [
    {
      name: 'Kyoto (Gion & Arashiyama)',
      country: 'Japan',
      region: 'Kansai',
      hook: 'Timeless wooden machiya townhouses, moss garden zen temples, and refined seasonal kaiseki gastronomy.',
      relevanceRationale: [
        `Unrivaled for ${prefs.persona}: deep immersion into tea ceremonies, ancient shrine paths, and culinary craftsmanship.`,
        `Balanced ${prefs.budgetTier} spend: incredible high-speed rail access and high-value dining from noodle bars to kaiseki.`,
        `Safe, walkable, and respectful atmosphere tailored to ${prefs.groupDynamic}.`,
      ],
      vibeTags: ['Zen Temples', 'Kaiseki Gastronomy', 'Bamboo Groves', 'Traditional Machiya'],
      climateMatch: 'Crisp, bright daylight with gentle evening breezes',
      budget: {
        tier: '$$$',
        dailyStayUsd: 190,
        dailyFoodUsd: 70,
        dailyTransportUsd: 25,
        dailyTotalUsd: 285,
        localCurrencyCode: 'JPY',
        localCurrencySymbol: '¥',
      },
      logistics: {
        primaryAirportCode: 'KIX',
        primaryAirportName: 'Kansai International Airport (Osaka/Kyoto)',
        visaSnapshot: 'Visa-free 90-day tourist entry; register online with Visit Japan Web before arrival.',
        bestNeighborhood: 'Higashiyama or Nakagyo-ku',
      },
      curatedItinerary: [
        {
          day: 1,
          title: 'Fushimi Inari Torii Dawn & Gion Twilight Walk',
          morning: 'Beat the crowds at 6:30 AM through thousands of vermilion torii gates winding up the sacred forested mountain.',
          afternoon: 'Explore Sanjusangendo hall with its 1,001 life-sized gilded statues of Kannon.',
          evening: 'Quiet walk through the lantern-lit stone alleys of Gion Shirakawa; enjoy a multi-course seasonal dinner.',
          highlightType: 'arrival_landmark',
        },
        {
          day: 2,
          title: 'Arashiyama Bamboo Forest & Tenryu-ji Zen Garden',
          morning: 'Glide through towering green stalks of the Sagano Bamboo Grove into the 14th-century pond garden of Tenryu-ji.',
          afternoon: 'Private matcha tea whisking ceremony inside an authentic preserved Edo-era machiya residence.',
          evening: 'Savor Kyoto-style Yudofu (silken tofu simmered in kelp broth) alongside the peaceful Hozu River.',
          highlightType: 'culture_adventure',
        },
        {
          day: 3,
          title: 'Philosopher’s Path & Nishiki Market Culinary Crawl',
          morning: 'Reflective walk along the stone canal of the Philosopher’s Path lined with weeping cherries and quiet shrines.',
          afternoon: 'Taste through Nishiki Market: fresh takoyaki, roasted hojicha soft serve, and seasonal pickled vegetables.',
          evening: 'Cozy counter seat at a hidden craft sake bar sampling Kansai region boutique brews.',
          highlightType: 'food_hidden_gem',
        },
      ],
      proTip: 'Add an IC card (Suica/Pasmo) to your Apple/Google Wallet for frictionless tap-and-go travel on all trains and buses.',
    },
    {
      name: 'San Sebastián (Donostia)',
      country: 'Spain',
      region: 'Basque Country',
      hook: 'The pintxos capital of the world, bordered by golden crescent beaches and Michelin-starred culinary royalty.',
      relevanceRationale: [
        `Foodie perfection for ${prefs.persona}: world-class bar crawls with bite-sized culinary art on every counter.`,
        `Comfortable ${prefs.budgetTier} fit: affordable pintxos hopping allows tasting legendary bites for just €3–€5 each.`,
        `Vibrant, social atmosphere made for ${prefs.groupDynamic} to celebrate and connect.`,
      ],
      vibeTags: ['Pintxos Crawls', 'Michelin Star Mecca', 'La Concha Beach', 'Basque Culture'],
      climateMatch: 'Mild Atlantic coastal breezes with warm sunny spells',
      budget: {
        tier: '$$',
        dailyStayUsd: 140,
        dailyFoodUsd: 65,
        dailyTransportUsd: 20,
        dailyTotalUsd: 225,
        localCurrencyCode: 'EUR',
        localCurrencySymbol: '€',
      },
      logistics: {
        primaryAirportCode: 'EAS',
        primaryAirportName: 'San Sebastián Airport (or BIO Bilbao)',
        visaSnapshot: 'Standard 90-day EU Schengen tourist entry.',
        bestNeighborhood: 'Parte Vieja (Old Town) & Gros',
      },
      curatedItinerary: [
        {
          day: 1,
          title: 'La Concha Promenade & Mount Urgull',
          morning: 'Morning barefoot walk along the graceful crescent curve of La Concha Beach.',
          afternoon: 'Climb Mount Urgull to explore medieval castle battlements overlooking the entire Bay of Biscay.',
          evening: 'Dive into Parte Vieja for your first pintxos crawl: slow-roasted sirloin skewers and charred octopus.',
          highlightType: 'arrival_landmark',
        },
        {
          day: 2,
          title: 'Txakoli Vineyard Tour & Coastal Catamaran',
          morning: 'Visit the coastal hills of Getaria to taste effervescent green Txakoli wine poured from high above the glass.',
          afternoon: 'Sail around Santa Clara Island on a private catamaran as the afternoon sun glints off the cliffs.',
          evening: 'Indulge in the iconic creamy caramelized Basque burnt cheesecake at the legendary La Viña.',
          highlightType: 'culture_adventure',
        },
        {
          day: 3,
          title: 'Gros Surfer Neighborhood & Hidden Cider House',
          morning: 'Watch surfers carve waves at Zurriola Beach; artisan espresso and sourdough pastries in Gros.',
          afternoon: 'Experience a traditional Basque cider house (sagardotegi) where guests pour cider straight from massive barrels.',
          evening: 'Sunset drinks at a cliffside pavilion listening to the roar of waves crashing into the Peine del Viento sculptures.',
          highlightType: 'food_hidden_gem',
        },
      ],
      proTip: 'Order 1-2 hot specialties made to order from the chalkboard (calientes) at each pintxo bar rather than only cold bar bites.',
    },
    {
      name: 'Tromsø & Senja Fjords',
      country: 'Norway',
      region: 'Arctic Circle',
      hook: 'Dancing northern lights over sharp Arctic fjords, indigenous Sámi reindeer camps, and Scandinavian cozy hygge.',
      relevanceRationale: [
        `Spectacular bucket-list adventure matching ${prefs.persona} and climate preference.`,
        `High-impact value for ${prefs.budgetTier}: unforgettable wilderness excursions with heated glass lavvus and fjord cruises.`,
        `Intimate, magical setting perfectly suited for ${prefs.groupDynamic}.`,
      ],
      vibeTags: ['Northern Lights', 'Arctic Fjords', 'Sámi Culture', 'Fjord Sauna'],
      climateMatch: 'Crisp Arctic chill with snow-draped peaks and warm indoor hearths',
      budget: {
        tier: '$$$',
        dailyStayUsd: 195,
        dailyFoodUsd: 75,
        dailyTransportUsd: 40,
        dailyTotalUsd: 310,
        localCurrencyCode: 'NOK',
        localCurrencySymbol: 'kr',
      },
      logistics: {
        primaryAirportCode: 'TOS',
        primaryAirportName: 'Tromsø Airport, Langnes',
        visaSnapshot: 'Norway is part of Schengen Area; 90-day visa-free for major international passports.',
        bestNeighborhood: 'Tromsø Island Harbor',
      },
      curatedItinerary: [
        {
          day: 1,
          title: 'Arctic Cathedral & Fjellheisen Cable Car',
          morning: 'Cross Tromsø Bridge to admire the triangular architecture of the Arctic Cathedral.',
          afternoon: 'Take the Fjellheisen cable car 421m up Mount Storsteinen for a breathtaking panoramic view of the island.',
          evening: 'Warm up with fresh King Crab soup and reindeer stew at a harbor-side historic warehouse restaurant.',
          highlightType: 'arrival_landmark',
        },
        {
          day: 2,
          title: 'Silent Electric Aurora Catamaran Cruise',
          morning: 'Visit the Polar Museum to discover heroic Arctic expeditions of Roald Amundsen.',
          afternoon: 'Dip in a floating fjord sauna followed by a refreshing plunge into the crisp Norwegian Sea.',
          evening: 'Board a silent electric catamaran away from city lights to witness the Aurora Borealis emerald curtains.',
          highlightType: 'culture_adventure',
        },
        {
          day: 3,
          title: 'Sámi Camp Reindeer Sledding & Storytelling',
          morning: 'Travel to a traditional Sámi reindeer camp; feed the herd and experience a serene wooden sled glide.',
          afternoon: 'Gather around the open fire inside a lavvu tent to listen to joik folk chanting and ancient Arctic legends.',
          evening: 'Farewell meal with grilled Arctic char and cloudberry tart at a cozy candlelit bistro.',
          highlightType: 'food_hidden_gem',
        },
      ],
      proTip: 'Dress strictly in wool base layers rather than cotton; wool traps warmth even when you transition from heated interiors to snowy trails.',
    },
  ];
}
