import React, { useState, useEffect } from 'react';
import { Compass, Radio, Clock, Maximize2, Minimize2 } from 'lucide-react';

function useMarsClock() {
  const [marsTime, setMarsTime] = useState({ sol: 0, time: '--:--:--' });

  useEffect(() => {
    function update() {
      // Perseverance touchdown: Feb 18, 2021, 20:55 UTC (Sol 0)
      const landingEpochMs = Date.UTC(2021, 1, 18, 20, 55, 0);
      const nowMs = Date.now();
      const elapsedSeconds = (nowMs - landingEpochMs) / 1000;

      // Martian Sol duration = 88,775.244 Earth seconds
      const marsSolSecs = 88775.244;
      const currentSol = Math.floor(elapsedSeconds / marsSolSecs);

      // Jezero Crater East Longitude = 77.58° (offset in sol seconds)
      const jezeroOffsetSecs = (77.58 / 360.0) * marsSolSecs;
      const solElapsedSecs = (elapsedSeconds + jezeroOffsetSecs) % marsSolSecs;

      const totalMarsHours = (solElapsedSecs / marsSolSecs) * 24.0;
      const hours = Math.floor(totalMarsHours);
      const mins = Math.floor((totalMarsHours * 60) % 60);
      const secs = Math.floor((totalMarsHours * 3600) % 60);

      const pad = (n) => String(n).padStart(2, '0');
      setMarsTime({
        sol: currentSol,
        time: `${pad(hours)}:${pad(mins)}:${pad(secs)}`
      });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return marsTime;
}

export default function Header({ backendStatus, activeTab, destinationPoint, isTacticalMode, onToggleTactical }) {
  const isOnline = backendStatus && backendStatus.status === 'ok';
  const marsTime = useMarsClock();

  return (
    <header className="h-14 border-b border-[#33363D] bg-[#191b20] px-4 flex items-center justify-between select-none z-20">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded bg-[#D97745]/20 border border-[#D97745] flex items-center justify-center text-[#D97745]">
          <Compass className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold tracking-wider text-base text-[#F3F3F3]">ASTRO-NAH</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#22252c] text-[#D97745] border border-[#33363D]">
              Jezero Crater Delta
            </span>
          </div>
          <p className="text-[11px] text-[#A6A8AD] leading-none">Martian Surface Exploration & Navigation</p>
        </div>
      </div>

      <div className="flex items-center space-x-4 sm:space-x-5 text-xs font-mono">
        {/* Real Mars Local Solar Time (LMST) & Sol Counter */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#101114] border border-[#33363D] text-[#A6A8AD]">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-white font-bold">SOL {marsTime.sol}</span>
          <span className="text-[#555]">|</span>
          <span className="text-sky-300 font-semibold">{marsTime.time}</span>
          <span className="text-[9px] text-[#888]">LMST</span>
        </div>

        {/* Dynamic Active Destination Target */}
        <div className="hidden sm:flex items-center space-x-1.5 text-[#A6A8AD]">
          <span className={destinationPoint ? "text-[#D97745] font-semibold" : "text-[#A6A8AD]"}>TARGET:</span>
          <span className="text-[#F3F3F3] font-mono">
            {destinationPoint 
              ? `${destinationPoint.lat}° N, ${destinationPoint.lng}° E` 
              : '18.38° N, 77.58° E'}
          </span>
          {destinationPoint && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97745] animate-pulse"></span>
          )}
        </div>

        {/* Backend Connectivity Status */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-[#22252c] border border-[#33363D]">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="text-[#A6A8AD]">BACKEND:</span>
          <span className={`font-semibold ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isOnline ? 'CONNECTED' : 'STANDBY'}
          </span>
        </div>

        {/* Tactical Ops View Toggle */}
        {onToggleTactical && (
          <button
            onClick={onToggleTactical}
            title={isTacticalMode ? "Exit Tactical Mode (Expand Sidebars)" : "Enter Tactical Ops Mode (Fullscreen Map)"}
            className={`p-1.5 rounded border transition-colors flex items-center space-x-1 ${
              isTacticalMode 
                ? 'bg-[#D97745] text-white border-[#D97745]' 
                : 'bg-[#22252c] text-[#A6A8AD] hover:text-white border-[#33363D]'
            }`}
          >
            {isTacticalMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* NASA Challenge Badge */}
        <div className="hidden xl:flex items-center space-x-1.5 text-[#A6A8AD]">
          <Radio className="w-3.5 h-3.5 text-[#D97745]" />
          <span>NASA SPACE APPS 2026</span>
        </div>
      </div>
    </header>
  );
}

