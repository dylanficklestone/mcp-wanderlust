/**
 * Express Application & API Routes for Wanderlust AI
 * Shared between local development (server.ts) and Vercel serverless deployment (api/index.ts)
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { generateTailoredTrips } from './geminiService.ts';
import {
  executeMcpDestinationVisuals,
  executeMcpFlightProximity,
  executeMcpLiveTravelContext,
} from './mcpTools.ts';

dotenv.config();

export const app = express();
app.use(express.json());

// API: Generate Tailored Trips (Live LLM + MCP enrichment)
app.post('/api/generate-trips', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const preferences = req.body;
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Invalid search preferences payload' });
    }

    const result = await generateTailoredTrips(preferences);
    return res.json(result);
  } catch (error: any) {
    console.error('Error generating trips:', error);
    return res.status(500).json({
      error: 'Failed to generate tailored destinations. Please try again.',
      details: error?.message || 'Internal Server Error',
    });
  }
});

// API: MCP Server Diagnostics & Tool Definitions
app.get('/api/mcp-status', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    status: 'online',
    protocolVersion: '2024-11-05',
    servers: [
      {
        id: 'mcp-server-visuals-geo',
        name: 'Visuals & Geo-Coordinates MCP Server',
        version: '1.2.0',
        activeTools: ['mcp_destination_visuals'],
        description: 'Authentic high-resolution photography, geo-coordinate resolution, and current weather context.',
      },
      {
        id: 'mcp-server-flight-router',
        name: 'Flight Proximity & Route Estimator MCP Server',
        version: '2.1.0',
        activeTools: ['mcp_flight_proximity'],
        description: 'Calculates origin-destination flight times, airport hubs, non-stop flags, and carbon estimates.',
      },
      {
        id: 'mcp-server-travel-context-grounding',
        name: 'Live Travel Context Grounding MCP Server',
        version: '1.0.4',
        activeTools: ['mcp_live_travel_context'],
        description: 'Pulls seasonal advisories, local festival calendars, neighborhood picks, and entry/visa rules.',
      },
    ],
    llmEngine: {
      provider: 'Google GenAI',
      model: 'gemini-3.1-flash-lite',
      modelAlias: 'gemini-3.1-flash',
      structuredOutputMode: 'responseSchema (JSON Type.OBJECT)',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5),
    },
  });
});

// API: Single MCP Tool execution test
app.post('/api/mcp/execute-tool', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { tool, args } = req.body;
    if (tool === 'mcp_destination_visuals') {
      const data = await executeMcpDestinationVisuals(args.destinationName, args.country, args.vibe);
      return res.json({ status: 'success', data });
    } else if (tool === 'mcp_flight_proximity') {
      const data = await executeMcpFlightProximity(
        args.originCity,
        args.destinationName,
        args.airportCode,
        args.lat,
        args.lng
      );
      return res.json({ status: 'success', data });
    } else if (tool === 'mcp_live_travel_context') {
      const data = await executeMcpLiveTravelContext(args.destinationName, args.country, args.travelTiming);
      return res.json({ status: 'success', data });
    }
    return res.status(404).json({ error: `Unknown MCP tool: ${tool}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default app;
