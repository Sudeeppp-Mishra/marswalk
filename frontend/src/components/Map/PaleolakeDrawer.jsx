import React, { useState } from 'react';
import { 
  Waves, 
  X, 
  Info, 
  Compass, 
  AlertTriangle, 
  ShieldCheck, 
  Navigation as RouteIcon,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PALEOLAKE_PRESETS, analyzeRouteUnderLake } from '../../utils/paleolake';
import { sfx } from '../../utils/audio';

export default function PaleolakeDrawer({
  isOpen,
  onClose,
  waterLevel,
  onWaterLevelChange,
  routeData,
  avoidWater,
  onToggleAvoidWater
}) {
  const [showScienceDetails, setShowScienceDetails] = useState(false);

  if (!isOpen) return null;

  const analysis = analyzeRouteUnderLake(routeData, waterLevel);

  const activePreset = PALEOLAKE_PRESETS.find(p => Math.abs(p.level - waterLevel) < 15);

  const handlePresetClick = (level) => {
    sfx.playBlip();
    onWaterLevelChange(level);
  };

  return (
    <div className="absolute top-14 left-3 sm:left-4 z-[1200] w-[94vw] sm:w-[420px] pointer-events-auto font-mono text-xs select-none animate-in slide-in-from-top-2 duration-200">
      <div className="bg-[#121418]/92 backdrop-blur-md border border-sky-500/50 rounded-xl shadow-2xl p-3.5 space-y-3 shadow-sky-950/40">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#33363D] pb-2">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-sky-500/20 text-sky-400 border border-sky-500/40">
              <Waves className="w-3.5 h-3.5" />
            </span>
            <div>
              <h3 className="font-bold text-white text-xs tracking-wider flex items-center space-x-1.5">
                <span>ANCIENT LAKE JEZERO (~3.7 Ga)</span>
              </h3>
              <p className="text-[9.5px] text-sky-300 font-normal">
                {waterLevel <= -2600 
                  ? 'Present Day: Dry regolith floor' 
                  : `Paleolake Depth: ~${Math.max(0, waterLevel - (-2567))} m (Floor at -2,567 m)`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close Paleolake Drawer"
            className="p-1 rounded text-[#A6A8AD] hover:text-white hover:bg-[#22252c] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Water Level Slider */}
        <div className="space-y-1.5 bg-[#0e1014]/70 p-2.5 rounded-lg border border-[#33363D]/60">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-[#A6A8AD] uppercase font-bold flex items-center space-x-1">
              <span>Simulated Water Level:</span>
            </span>
            <span className="font-bold px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-500/40">
              {waterLevel <= -2600 ? 'Dry (-2,650 m)' : `${waterLevel.toFixed(0)} m (datum)`}
            </span>
          </div>

          <input
            type="range"
            min="-2650"
            max="-2350"
            step="5"
            value={waterLevel}
            onChange={(e) => onWaterLevelChange(parseFloat(e.target.value))}
            className="w-full accent-sky-400 h-1.5 bg-[#1a1d24] rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[8px] text-[#A6A8AD]">
            <span>-2,650 m (Dry)</span>
            <span className="text-sky-300 font-bold">-2,395 m (Delta Highstand)</span>
            <span>-2,350 m (Spillway)</span>
          </div>
        </div>

        {/* Quick Presets Pills */}
        <div className="space-y-1">
          <div className="text-[9px] uppercase font-bold text-[#A6A8AD] tracking-wider">
            Scientific Paleolake Stages:
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {PALEOLAKE_PRESETS.map((p) => {
              const isSelected = activePreset?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePresetClick(p.level)}
                  className={`px-2 py-1.5 rounded text-[10px] text-left border transition-all ${
                    isSelected
                      ? 'bg-sky-500/25 border-sky-400 text-sky-200 font-bold shadow-sm shadow-sky-500/30'
                      : 'bg-[#181a20]/80 border-[#33363D] text-[#A6A8AD] hover:text-white hover:bg-[#22252c]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{p.shortLabel}</span>
                    <span className="text-[8px] text-sky-400 font-normal ml-1">{p.level}m</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Route Impact Analysis Banner (When route is active) */}
        {analysis && (
          <div className={`p-2.5 rounded-lg border text-[10px] space-y-1 transition-all ${
            analysis.isSubmerged
              ? 'bg-sky-950/50 border-sky-500/60 text-sky-100'
              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
          }`}>
            <div className="flex items-center space-x-1.5 font-bold">
              {analysis.isSubmerged ? (
                <>
                  <Waves className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                  <span>Traverse Paleohydrology Impact</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Subaerial Terrestrial Route</span>
                </>
              )}
            </div>

            {analysis.isSubmerged ? (
              <p className="text-[10px] leading-relaxed">
                Under a lake at <strong className="text-white">{waterLevel} m</strong>,{' '}
                <strong className="text-sky-300 font-bold">{analysis.submergedKm} km ({analysis.pct}%)</strong> of this traverse would be underwater! (Max depth: <strong className="text-white">{analysis.maxDepth} m</strong>)
              </p>
            ) : (
              <p className="text-[10px] leading-relaxed">
                100% dry land: This entire traverse remains safely above the ancient paleolake shoreline.
              </p>
            )}

            {/* Shoreline Avoidance Toggle */}
            {onToggleAvoidWater && (
              <div className="pt-1 flex items-center justify-between border-t border-sky-500/20 mt-1">
                <span className="text-[9px] text-[#A6A8AD]">Constrain to Dry Shoreline:</span>
                <button
                  onClick={() => {
                    sfx.playBlip();
                    onToggleAvoidWater();
                  }}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                    avoidWater
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                      : 'bg-[#22252c] border-[#33363D] text-[#A6A8AD] hover:text-white'
                  }`}
                >
                  {avoidWater ? 'Avoid Water: ON' : 'Avoid Water: OFF'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Scientific Context & Why NASA Landed Here */}
        <div className="border-t border-[#33363D]/60 pt-1.5">
          <button
            onClick={() => setShowScienceDetails(!showScienceDetails)}
            className="w-full flex items-center justify-between text-[9px] text-[#A6A8AD] hover:text-sky-300 transition-colors py-0.5"
          >
            <span className="flex items-center space-x-1">
              <Info className="w-3 h-3 text-sky-400" />
              <span className="font-bold">Why NASA Landed Here (Science Story)</span>
            </span>
            {showScienceDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showScienceDetails && (
            <div className="mt-1.5 p-2 rounded bg-[#0a0c10]/90 border border-sky-500/30 text-[9px] text-[#C4C7CC] space-y-1.5 leading-relaxed">
              <p>
                <strong className="text-sky-300">Gilbert-Type Delta Evidence:</strong> Perseverance’s Mastcam-Z and SuperCam verified that the scarp at Kodiak Butte contains dipping foreset beds, proving an ancient standing body of water at approximately <strong className="text-white">-2,400 ± 10 m</strong>.
              </p>
              <p>
                <strong className="text-amber-300">Why It Matters for Routing:</strong> When you drag the water level up to -2,395 m, the Western Delta transforms into an authentic shoreline where river waters slowed down, dropping sediment that could preserve Martian biosignatures.
              </p>
              <div className="text-[8px] text-[#888] border-t border-[#33363D] pt-1">
                Refs: Fassett & Head (2005) <em>GRL</em>; Goudge et al. (2018) <em>JGR Planets</em>; Mangold et al. (2021) <em>Science</em>.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

