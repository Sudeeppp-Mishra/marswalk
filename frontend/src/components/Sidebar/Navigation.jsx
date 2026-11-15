import React from 'react';
import { 
  Compass, 
  Layers, 
  Mountain, 
  Navigation as RouteIcon, 
  Sparkles, 
  Info 
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'explore', label: 'Explore Mars', icon: Compass, badge: 'Live' },
  { id: 'terrain', label: 'Terrain Analysis', icon: Mountain, badge: 'DEM' },
  { id: 'route', label: 'Route Planner', icon: RouteIcon, badge: 'A*' },
  { id: 'insights', label: 'Scientific Insights', icon: Sparkles, badge: 'USGS' },
  { id: 'about', label: 'About Project', icon: Info, badge: null },
];

export default function Navigation({ activeTab, setActiveTab }) {
  return (
    <aside className="w-56 bg-[#191b20] border-r border-[#33363D] flex flex-col justify-between select-none">
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] uppercase font-mono tracking-wider text-[#A6A8AD]">
          Navigation Modules
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#22252c] text-[#F3F3F3] border-l-2 border-[#D97745]'
                  : 'text-[#A6A8AD] hover:bg-[#22252c]/50 hover:text-[#F3F3F3]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#D97745]' : 'text-[#A6A8AD]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                  isActive ? 'bg-[#D97745]/20 text-[#D97745]' : 'bg-[#101114] text-[#A6A8AD]'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t border-[#33363D] text-[11px] text-[#A6A8AD] space-y-2 font-mono">
        <div className="flex justify-between">
          <span>Mission Area:</span>
          <span className="text-[#F3F3F3]">Jezero Delta</span>
        </div>
        <div className="flex justify-between">
          <span>Target CRS:</span>
          <span className="text-[#F3F3F3]">Mars IAU 2000</span>
        </div>
        <div className="pt-2 text-[10px] text-[#A6A8AD]/70 text-center">
          Astro-nah v1.0 • NASA Space Apps 2026
        </div>
      </div>
    </aside>
  );
}

