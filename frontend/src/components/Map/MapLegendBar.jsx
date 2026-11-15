import React from 'react';
import { Mountain, TrendingUp } from 'lucide-react';

export default function MapLegendBar({ activeLayer }) {
  if (activeLayer !== 'elevation' && activeLayer !== 'slope') return null;

  return (
    <div className="absolute bottom-2 right-14 z-[1000] pointer-events-auto hidden sm:block">
      <div className="bg-[#191b20]/95 backdrop-blur-md border border-[#33363D] rounded-lg p-2 font-mono text-[10px] text-[#F3F3F3] shadow-xl w-60 space-y-1.5">
        {activeLayer === 'elevation' && (
          <>
            <div className="flex items-center justify-between text-[#A6A8AD]">
              <div className="flex items-center space-x-1">
                <Mountain className="w-3 h-3 text-[#38BDF8]" />
                <span className="font-bold text-white">ELEVATION (TURBO)</span>
              </div>
              <span>20m DTM</span>
            </div>
            {/* Turbo gradient simulation bar */}
            <div 
              className="h-2.5 w-full rounded border border-[#33363D]" 
              style={{
                background: 'linear-gradient(to right, #30123b, #4686fb, #1ae4b6, #a2fc3c, #fbb826, #e4460a, #7a0403)'
              }}
            />
            <div className="flex justify-between text-[9px] text-[#A6A8AD]">
              <span>-2,710 m (Floor)</span>
              <span>-2,100 m</span>
              <span>-1,515 m (Rim)</span>
            </div>
          </>
        )}

        {activeLayer === 'slope' && (
          <>
            <div className="flex items-center justify-between text-[#A6A8AD]">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-[#D97745]" />
                <span className="font-bold text-white">SLOPE HAZARD</span>
              </div>
              <span>Threshold: 20°</span>
            </div>
            {/* Slope gradient bar */}
            <div 
              className="h-2.5 w-full rounded border border-[#33363D]" 
              style={{
                background: 'linear-gradient(to right, #000004, #3b0f70, #8c2981, #de4968, #fe9f6d, #fcfdbf)'
              }}
            />
            <div className="flex justify-between text-[9px]">
              <span className="text-emerald-400">0° (Nominal)</span>
              <span className="text-amber-400">10° (Caution)</span>
              <span className="text-rose-400">20°+ (Hazard)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

