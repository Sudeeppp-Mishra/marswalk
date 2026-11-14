import React from 'react';
import { Crosshair, Mountain, TrendingUp, Navigation } from 'lucide-react';

export default function BottomBar({ cursorCoords, startPoint, destinationPoint }) {
  return (
    <footer className="h-9 bg-[#191b20] border-t border-[#33363D] px-4 flex items-center justify-between text-xs font-mono select-none text-[#A6A8AD] z-20">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-1.5">
          <Crosshair className="w-3.5 h-3.5 text-[#D97745]" />
          <span>CURSOR:</span>
          <span className="text-[#F3F3F3]">
            {cursorCoords.lat && cursorCoords.lng 
              ? `${cursorCoords.lat}° N, ${cursorCoords.lng}° E` 
              : '18.3800° N, 77.5800° E'}
          </span>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5">
          <Mountain className="w-3.5 h-3.5 text-[#A6A8AD]" />
          <span>ELEVATION:</span>
          <span className="text-[#F3F3F3]">-2,500 m (datum)</span>
        </div>

        <div className="hidden md:flex items-center space-x-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#A6A8AD]" />
          <span>EST. SLOPE:</span>
          <span className="text-[#F3F3F3]">Pending DEM</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          <Navigation className="w-3.5 h-3.5 text-[#D97745]" />
          <span>ROUTE:</span>
          <span className="text-[#F3F3F3]">
            {startPoint && destinationPoint ? 'Ready to compute' : 'Select origin & dest'}
          </span>
        </div>
      </div>
    </footer>
  );
}

