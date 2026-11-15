import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

export default function GeologyLegendBar({ showGeology, hasActiveRoute = false }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!showGeology) return null;

  const units = [
    { name: "Neretva Canyon (HNch)", color: "#EC4899", desc: "Fluvial inlet channel" },
    { name: "Western Delta (HNb)", color: "#F59E0B", desc: "Sedimentary clay/mudstone" },
    { name: "Séítah Unit (Ncf)", color: "#10B981", desc: "Olivine igneous cumulate" },
    { name: "Máaz Formation (Hcf)", color: "#6366F1", desc: "Crater floor basalt" },
  ];

  return (
    <div className={`absolute ${hasActiveRoute ? 'bottom-[142px]' : 'bottom-2'} left-3 z-[1000] pointer-events-auto hidden sm:block transition-all duration-300`}>
      <div className="bg-[#191b20]/95 backdrop-blur-md border border-[#33363D] rounded-lg p-2 font-mono text-[10px] text-[#F3F3F3] shadow-2xl w-64 space-y-1.5">
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-between border-b border-[#33363D] pb-1 cursor-pointer select-none hover:text-amber-300 transition-colors"
        >
          <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
            <Layers className="w-3.5 h-3.5" />
            <span>USGS GEOLOGY (SIM 3464 Schematic)</span>
          </div>
          <div className="flex items-center space-x-1 text-[#A6A8AD]">
            <span className="text-[8px] uppercase">Approx</span>
            {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </div>
        </div>

        {!isCollapsed && (
          <div className="space-y-1 pt-0.5">
            {units.map((u, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0" 
                    style={{ backgroundColor: u.color }}
                  />
                  <span className="text-white font-medium">{u.name}</span>
                </div>
                <span className="text-[9px] text-[#A6A8AD]">{u.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

