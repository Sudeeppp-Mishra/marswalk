import React from 'react';
import { Crosshair, Mountain, TrendingUp, Navigation } from 'lucide-react';

export default function BottomBar({ cursorCoords, startPoint, destinationPoint }) {
  const hasElevation = cursorCoords.elevation !== undefined && cursorCoords.elevation !== null;
  const hasSlope = cursorCoords.slope !== undefined && cursorCoords.slope !== null;

  return (
    <footer className="h-9 bg-[#191b20] border-t border-[#33363D] px-4 flex items-center justify-between text-xs font-mono select-none text-[#A6A8AD] z-20">
      <div className="flex items-center space-x-6">
        {/* Lat/Lon Cursor */}
        <div className="flex items-center space-x-1.5">
          <Crosshair className="w-3.5 h-3.5 text-[#D97745]" />
          <span>CURSOR:</span>
          <span className="text-[#F3F3F3]">
            {cursorCoords.lat && cursorCoords.lng 
              ? `${cursorCoords.lat}° N, ${cursorCoords.lng}° E` 
              : '18.3800° N, 77.5800° E'}
          </span>
        </div>

        {/* Real Elevation */}
        <div className="flex items-center space-x-1.5">
          <Mountain className="w-3.5 h-3.5 text-[#A6A8AD]" />
          <span>ELEVATION:</span>
          <span className="text-[#F3F3F3] font-semibold">
            {hasElevation 
              ? `${cursorCoords.elevation.toLocaleString()} m (datum)` 
              : '-2,628 m (datum)'}
          </span>
        </div>

        {/* Real Slope */}
        <div className="hidden sm:flex items-center space-x-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#A6A8AD]" />
          <span>SLOPE:</span>
          <span className={`font-semibold ${
            hasSlope 
              ? (cursorCoords.slope > 20 
                  ? 'text-rose-400' 
                  : (cursorCoords.slope > 10 ? 'text-amber-400' : 'text-emerald-400'))
              : 'text-emerald-400'
          }`}>
            {hasSlope ? `${cursorCoords.slope}°` : '1.99°'}
          </span>
          {cursorCoords.risk_tier && (
            <span className="text-[10px] text-[#A6A8AD]">({cursorCoords.risk_tier})</span>
          )}
        </div>
      </div>

      {/* Route Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          <Navigation className="w-3.5 h-3.5 text-[#D97745]" />
          <span>ROUTE:</span>
          <span className="text-[#F3F3F3]">
            {startPoint && destinationPoint ? 'Waypoints Placed (A* Ready)' : 'Click map to place origin & dest'}
          </span>
        </div>
      </div>
    </footer>
  );
}
