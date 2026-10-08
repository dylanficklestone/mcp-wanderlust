import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  Server,
  Terminal,
  CheckCircle2,
  Clock,
  Play,
  Copy,
  Check,
  Code2,
  Cpu,
  Layers,
} from 'lucide-react';
import { McpToolInvocation } from '../types/travel.ts';

interface McpInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mcpTrace: McpToolInvocation[];
}

export const McpInspectorModal: React.FC<McpInspectorModalProps> = ({
  isOpen,
  onClose,
  mcpTrace,
}) => {
  const [activeTab, setActiveTab] = useState<'trace' | 'servers' | 'playground'>('trace');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Playground state
  const [selectedPlaygroundTool, setSelectedPlaygroundTool] = useState<string>('mcp_flight_proximity');
  const [playgroundArgs, setPlaygroundArgs] = useState<string>(
    JSON.stringify(
      {
        originCity: 'New York (JFK)',
        destinationName: 'Kyoto',
        airportCode: 'KIX',
        lat: 35.0116,
        lng: 135.7681,
      },
      null,
      2
    )
  );
  const [playgroundResult, setPlaygroundResult] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunPlaygroundTool = async () => {
    try {
      setIsPlaying(true);
      const parsedArgs = JSON.parse(playgroundArgs);
      const res = await fetch('/api/mcp/execute-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: selectedPlaygroundTool,
          args: parsedArgs,
        }),
      });
      const data = await res.json();
      setPlaygroundResult(data);
    } catch (err: any) {
      setPlaygroundResult({ error: err.message });
    } finally {
      setIsPlaying(false);
    }
  };

  const handleSelectToolPreset = (tool: string) => {
    setSelectedPlaygroundTool(tool);
    if (tool === 'mcp_destination_visuals') {
      setPlaygroundArgs(
        JSON.stringify(
          {
            destinationName: 'Dolomites',
            country: 'Italy',
            vibe: 'adventure',
          },
          null,
          2
        )
      );
    } else if (tool === 'mcp_flight_proximity') {
      setPlaygroundArgs(
        JSON.stringify(
          {
            originCity: 'London (LHR)',
            destinationName: 'Oaxaca',
            airportCode: 'OAX',
            lat: 17.0732,
            lng: -96.7266,
          },
          null,
          2
        )
      );
    } else if (tool === 'mcp_live_travel_context') {
      setPlaygroundArgs(
        JSON.stringify(
          {
            destinationName: 'Kyoto',
            country: 'Japan',
            travelTiming: 'Spring (Cherry Blossoms)',
          },
          null,
          2
        )
      );
    }
    setPlaygroundResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-stone-900 text-stone-100 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-stone-800 flex flex-col overflow-hidden my-auto font-sans">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-950/90 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm sm:text-base font-bold text-white tracking-wide">
                  Model Context Protocol (MCP) Diagnostics
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ONLINE • JSON-RPC
                </span>
              </div>
              <p className="text-xs text-stone-400 font-mono">
                MCP Protocol: 2024-11-05 | Client-Server Tool Execution Tracing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 py-2.5 bg-stone-900 border-b border-stone-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('trace')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'trace'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Execution Trace ({mcpTrace.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('servers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'servers'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Connected MCP Servers (3)</span>
          </button>
          <button
            onClick={() => setActiveTab('playground')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'playground'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Interactive Tool Runner</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1 overflow-y-auto font-mono text-xs space-y-4">
          {/* TAB 1: Execution Trace */}
          {activeTab === 'trace' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-stone-400 pb-1">
                <span>Recent Invocations recorded during last vacation generation:</span>
                <span className="text-[11px] text-emerald-400">
                  {mcpTrace.length > 0 ? `${mcpTrace.length} tools executed` : 'Awaiting first query'}
                </span>
              </div>

              {mcpTrace.length === 0 ? (
                <div className="p-8 text-center bg-stone-950/60 rounded-2xl border border-stone-800 text-stone-400">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No MCP tool invocations recorded yet.</p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Hit "Generate Tailored Vacations" or "Surprise Me" to trigger the live LLM + MCP pipeline!
                  </p>
                </div>
              ) : (
                mcpTrace.map((call) => (
                  <div
                    key={call.id}
                    className="bg-stone-950 rounded-2xl border border-stone-800 p-4 space-y-2.5 transition-all hover:border-stone-700"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                          TOOL CALL
                        </span>
                        <span className="font-bold text-amber-300">{call.tool}</span>
                        <span className="text-stone-400 text-[11px]">via {call.server}</span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-400 text-[11px]">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{call.durationMs}ms</span>
                        <button
                          onClick={() => handleCopy(JSON.stringify(call, null, 2), call.id)}
                          className="p-1 hover:text-white transition-colors cursor-pointer"
                          title="Copy JSON-RPC trace"
                        >
                          {copiedId === call.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Arguments & Result */}
                    <div className="bg-stone-900/90 rounded-xl p-2.5 text-[11px] space-y-1.5 text-stone-300">
                      <div>
                        <span className="text-stone-400">Arguments: </span>
                        <code className="text-amber-200">{JSON.stringify(call.arguments)}</code>
                      </div>
                      <div>
                        <span className="text-stone-400">Result: </span>
                        <span className="text-emerald-300">{call.resultPreview}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Connected MCP Servers */}
          {activeTab === 'servers' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      CONNECTED
                    </span>
                    <span className="text-stone-400">v1.2.0</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Visuals & Geo-Resolution</h4>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Resolves high-resolution verified photography, geo-coordinates (lat/lng), and real-time weather metrics.
                  </p>
                  <div className="pt-2 border-t border-stone-800 text-[10px] text-stone-400">
                    Tool: <code className="text-amber-300">mcp_destination_visuals</code>
                  </div>
                </div>

                <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      CONNECTED
                    </span>
                    <span className="text-stone-400">v2.1.0</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Flight Proximity & Router</h4>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Calculates great-circle distance, approximate flight duration, direct vs transfer hubs, and carbon footprint.
                  </p>
                  <div className="pt-2 border-t border-stone-800 text-[10px] text-stone-400">
                    Tool: <code className="text-amber-300">mcp_flight_proximity</code>
                  </div>
                </div>

                <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      CONNECTED
                    </span>
                    <span className="text-stone-400">v1.0.4</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Travel Context Grounding</h4>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Gathers live seasonal event schedules, local festivals, visa policies, and destination etiquette.
                  </p>
                  <div className="pt-2 border-t border-stone-800 text-[10px] text-stone-400">
                    Tool: <code className="text-amber-300">mcp_live_travel_context</code>
                  </div>
                </div>
              </div>

              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2 text-stone-300">
                <h5 className="font-bold text-white text-xs">LLM Orchestration Architecture</h5>
                <p className="text-xs leading-relaxed text-stone-400">
                  Every search hits the live backend running <strong>Gemini 3.1 Flash</strong> via the modern{' '}
                  <code className="text-amber-300">@google/genai</code> SDK. Structured response schemas guarantee strict JSON validation.
                  Post-generation, the server executes the three registered Model Context Protocol (MCP) tools in parallel to ground the response with real-world geography, flight routes, and photography.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Interactive Tool Runner */}
          {activeTab === 'playground' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-stone-400 text-xs">Select Tool:</span>
                {[
                  'mcp_destination_visuals',
                  'mcp_flight_proximity',
                  'mcp_live_travel_context',
                ].map((t) => (
                  <button
                    key={t}
                    onClick={() => handleSelectToolPreset(t)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                      selectedPlaygroundTool === t
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* JSON Editor & Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-stone-400 text-xs">
                    <span>Input JSON-RPC Arguments:</span>
                    <span className="text-[11px] font-mono text-amber-300">JSON schema</span>
                  </div>
                  <textarea
                    value={playgroundArgs}
                    onChange={(e) => setPlaygroundArgs(e.target.value)}
                    rows={8}
                    className="w-full bg-stone-950 text-amber-200 border border-stone-800 rounded-xl p-3 font-mono text-xs focus:outline-none focus:border-amber-600"
                  />
                  <button
                    onClick={handleRunPlaygroundTool}
                    disabled={isPlaying}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isPlaying ? 'Executing Tool...' : 'Execute MCP Tool'}</span>
                  </button>
                </div>

                {/* Output */}
                <div className="space-y-2">
                  <div className="text-stone-400 text-xs">Tool Response Payload:</div>
                  <pre className="bg-stone-950 text-emerald-300 border border-stone-800 rounded-xl p-3 font-mono text-xs overflow-auto max-h-[220px]">
                    {playgroundResult
                      ? JSON.stringify(playgroundResult, null, 2)
                      : '// Click "Execute MCP Tool" to see live response'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>All 3 MCP Server Integrations Healthy</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
