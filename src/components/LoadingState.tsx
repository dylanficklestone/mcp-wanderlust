import React, { useState, useEffect } from 'react';
import { Sparkles, Compass, Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react';
import { TRAVEL_TRIVIA } from '../utils/travelUtils.ts';

const MCP_STEPS = [
  { id: 1, label: 'Querying Gemini 3.1 Flash LLM (Structured JSON mode)...', detail: 'Generating 3 tailored destination candidates based on user criteria' },
  { id: 2, label: 'MCP Server: Visuals & Geo-Coordinates...', detail: 'Resolving authentic high-resolution photography and latitude/longitude' },
  { id: 3, label: 'MCP Server: Flight Proximity & Transit Router...', detail: 'Calculating flight hours, great-circle distances, and airport hubs' },
  { id: 4, label: 'MCP Server: Live Travel Context & Advisories...', detail: 'Checking seasonal events, festivals, and entry requirements' },
];

export const LoadingState: React.FC = () => {
  const [currentTriviaIdx, setCurrentTriviaIdx] = useState(0);
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  useEffect(() => {
    const triviaInterval = setInterval(() => {
      setCurrentTriviaIdx((prev) => (prev + 1) % TRAVEL_TRIVIA.length);
    }, 3800);

    const stepInterval = setInterval(() => {
      setActiveStepIdx((prev) => (prev < MCP_STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);

    return () => {
      clearInterval(triviaInterval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div className="space-y-8 py-8 animate-in fade-in duration-300">
      {/* Live Pipeline Tracker Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-stone-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold tracking-wide border border-amber-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
              <span>LIVE ORCHESTRATION PIPELINE</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Curating Your Tailored Escapes...
            </h3>
            <p className="text-stone-300 text-sm max-w-xl">
              Synthesizing travel archetypes, calculating flight transit corridors, and pulling authentic visual assets through Model Context Protocol (MCP).
            </p>
          </div>

          {/* Current MCP Task Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[280px]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-300 flex items-center justify-between">
              <span>Active Process</span>
              <span className="animate-spin text-amber-400">✦</span>
            </div>
            <div className="text-sm font-semibold text-white mt-1">
              {MCP_STEPS[activeStepIdx].label}
            </div>
            <div className="text-xs text-stone-300 mt-0.5">
              {MCP_STEPS[activeStepIdx].detail}
            </div>
          </div>
        </div>

        {/* Step Progression Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          {MCP_STEPS.map((step, idx) => {
            const isCompleted = idx < activeStepIdx;
            const isCurrent = idx === activeStepIdx;
            return (
              <div
                key={step.id}
                className={`p-3 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-amber-500/20 border border-amber-400/40'
                    : isCompleted
                    ? 'bg-white/5 border border-white/10 opacity-80'
                    : 'bg-white/5 border border-white/5 opacity-40'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="font-mono text-amber-400">{step.id}.</span>
                  )}
                  <span className="truncate">{step.label.split('...')[0]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rotating Travel Trivia Callout */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs transition-all">
        <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Traveler Note & Insight
          </div>
          <p className="text-stone-800 text-sm font-medium italic transition-all duration-300">
            "{TRAVEL_TRIVIA[currentTriviaIdx]}"
          </p>
        </div>
      </div>

      {/* Destination Skeleton Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-sm animate-pulse flex flex-col justify-between"
          >
            {/* Hero Image Skeleton */}
            <div className="h-56 bg-stone-200/80 relative">
              <div className="absolute top-4 left-4 h-6 w-24 bg-stone-300 rounded-full"></div>
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <div className="h-6 w-3/4 bg-stone-300 rounded-lg"></div>
                <div className="h-4 w-1/2 bg-stone-300 rounded-lg"></div>
              </div>
            </div>

            {/* Body Skeleton */}
            <div className="p-6 space-y-5">
              {/* Hook */}
              <div className="space-y-1.5">
                <div className="h-4 w-full bg-stone-200 rounded"></div>
                <div className="h-4 w-5/6 bg-stone-200 rounded"></div>
              </div>

              {/* Rationale */}
              <div className="p-3.5 bg-stone-50 rounded-2xl space-y-2">
                <div className="h-3 w-1/3 bg-stone-200 rounded"></div>
                <div className="h-3 w-full bg-stone-200 rounded"></div>
                <div className="h-3 w-4/5 bg-stone-200 rounded"></div>
              </div>

              {/* Cost & Logistics Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-stone-100">
                <div className="h-14 bg-stone-100 rounded-xl"></div>
                <div className="h-14 bg-stone-100 rounded-xl"></div>
              </div>

              {/* Itinerary Skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-1/2 bg-stone-200 rounded"></div>
                <div className="h-12 bg-stone-100 rounded-xl"></div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between">
              <div className="h-8 w-24 bg-stone-200 rounded-xl"></div>
              <div className="h-8 w-28 bg-stone-200 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
